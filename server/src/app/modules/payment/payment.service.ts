import httpStatus from "http-status-codes";
import { isValidObjectId } from "mongoose";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { generatePdf, type IInvoiceData } from "../../utils/invoice";
import { sendEmail } from "../../utils/sendEmail";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import type { ITour } from "../tour/tour.interface";
import type { IUser } from "../user/user.interface";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";

const initPayment = async (bookingId: string, userId: string) => {
	if (!isValidObjectId(bookingId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid booking id.");
	}

	const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate<{ user: IUser }>(
		"user",
		"name email phone address",
	);

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}
	if (booking.status !== BOOKING_STATUS.PENDING && booking.status !== BOOKING_STATUS.FAILED) {
		throw new AppError(httpStatus.BAD_REQUEST, `A ${booking.status} booking cannot be paid.`);
	}

	const payment = await Payment.findOne({ booking: booking._id });

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found for this booking.");
	}

	const { name, email, phone, address } = booking.user;

	if (!phone || !address) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please update your profile (phone and address) before paying.");
	}

	const transactionId = getTransactionId();

	const session = await Booking.startSession();
	session.startTransaction();

	try {
		await Payment.updateOne(
			{ _id: payment._id },
			{ transactionId, status: PAYMENT_STATUS.UNPAID },
			{ runValidators: true, session },
		);
		await Booking.updateOne({ _id: booking._id }, { status: BOOKING_STATUS.PENDING }, { session });

		const paymentUrl = await SSLService.sslPaymentInit({
			name,
			email,
			phoneNumber: phone,
			address,
			amount: payment.amount,
			transactionId,
		});

		await session.commitTransaction();
		return { paymentUrl };
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};
const successPayment = async (query: Record<string, string>) => {
	const session = await Booking.startSession();
	session.startTransaction();

	try {
		const updatedPayment = await Payment.findOneAndUpdate(
			{ transactionId: query.transactionId },
			{
				status: PAYMENT_STATUS.PAID,
			},
			{ new: true, runValidators: true, session: session },
		);

		if (!updatedPayment) {
			throw new AppError(401, "Payment not found");
		}

		const updatedBooking = await Booking.findByIdAndUpdate(
			updatedPayment?.booking,
			{ status: BOOKING_STATUS.COMPLETE },
			{ new: true, runValidators: true, session },
		)
			.populate("tour", "title")
			.populate("user", "name email");

		if (!updatedBooking) {
			throw new AppError(401, "Booking not found");
		}

		const invoiceData: IInvoiceData = {
			bookingDate: updatedBooking.createdAt as Date,
			guestCount: updatedBooking.guestCount,
			totalAmount: updatedPayment.amount,
			tourTitle: (updatedBooking.tour as unknown as ITour).title,
			transactionId: updatedPayment.transactionId,
			userName: (updatedBooking.user as unknown as IUser).name,
		};

		const pdfBuffer = await generatePdf(invoiceData);

		const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

		if (!cloudinaryResult) {
			throw new AppError(401, "Error uploading pdf");
		}

		await Payment.findByIdAndUpdate(
			updatedPayment._id,
			{ invoiceUrl: cloudinaryResult.secure_url },
			{ runValidators: true, session },
		);

		await sendEmail({
			to: (updatedBooking.user as unknown as IUser).email,
			subject: "Your Booking Invoice",
			templateName: "invoice",
			templateData: invoiceData,
			attachments: [
				{
					filename: "invoice.pdf",
					content: pdfBuffer,
					contentType: "application/pdf",
				},
			],
		});

		await session.commitTransaction();
		session.endSession();
		return { success: true, message: "Payment Completed Successfully" };
	} catch (error) {
		await session.abortTransaction();
		session.endSession();

		throw error;
	}
};
const failPayment = async (query: Record<string, string>) => {
	const session = await Booking.startSession();
	session.startTransaction();

	try {
		const updatedPayment = await Payment.findOneAndUpdate(
			{ transactionId: query.transactionId },
			{
				status: PAYMENT_STATUS.FAILED,
			},
			{ new: true, runValidators: true, session: session },
		);

		await Booking.findByIdAndUpdate(
			updatedPayment?.booking,
			{ status: BOOKING_STATUS.FAILED },
			{ runValidators: true, session },
		);

		await session.commitTransaction();
		session.endSession();
		return { success: false, message: "Payment Failed" };
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		throw error;
	}
};
const cancelPayment = async (query: Record<string, string>) => {
	const session = await Booking.startSession();
	session.startTransaction();

	try {
		const updatedPayment = await Payment.findOneAndUpdate(
			{ transactionId: query.transactionId },
			{
				status: PAYMENT_STATUS.CANCELLED,
			},
			{ runValidators: true, session: session },
		);

		await Booking.findByIdAndUpdate(
			updatedPayment?.booking,
			{ status: BOOKING_STATUS.CANCEL },
			{ runValidators: true, session },
		);

		await session.commitTransaction();
		session.endSession();
		return { success: false, message: "Payment Cancelled" };
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		throw error;
	}
};

const getInvoiceDownloadUrl = async (paymentId: string) => {
	const payment = await Payment.findById(paymentId).select("invoiceUrl");

	if (!payment) {
		throw new AppError(401, "Payment not found");
	}

	if (!payment.invoiceUrl) {
		throw new AppError(401, "No invoice found");
	}

	return payment.invoiceUrl;
};

export const PaymentService = {
	initPayment,
	successPayment,
	failPayment,
	cancelPayment,
	getInvoiceDownloadUrl,
};
