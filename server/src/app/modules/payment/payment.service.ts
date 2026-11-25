import httpStatus from "http-status-codes";
import { isValidObjectId, type Types } from "mongoose";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { generatePdf, type IInvoiceData } from "../../utils/invoice";
import { sendEmail } from "../../utils/sendEmail";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import type { ISSLValidationResponse } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import type { ITour } from "../tour/tour.interface";
import { Role, type IUser } from "../user/user.interface";
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
const isPaymentVerified = (gateway: ISSLValidationResponse, transactionId: string, amount: number) =>
	(gateway.status === "VALID" || gateway.status === "VALIDATED") &&
	gateway.tran_id === transactionId &&
	gateway.currency === "BDT" &&
	Math.abs(Number(gateway.amount) - amount) < 0.01;

const sendInvoice = async (paymentId: string) => {
	const payment = await Payment.findById(paymentId);
	const booking = await Booking.findById(payment?.booking)
		.populate<{ tour: ITour }>("tour", "title")
		.populate<{ user: IUser }>("user", "name email");

	if (!payment || !booking) return;

	const invoiceData: IInvoiceData = {
		bookingDate: booking.createdAt as Date,
		guestCount: booking.guestCount,
		totalAmount: payment.amount,
		tourTitle: booking.tour.title,
		transactionId: payment.transactionId,
		userName: booking.user.name,
	};

	const pdfBuffer = await generatePdf(invoiceData);
	const uploaded = await uploadBufferToCloudinary(pdfBuffer, "invoice");

	if (uploaded) {
		await Payment.updateOne({ _id: payment._id }, { invoiceUrl: uploaded.secure_url });
	}

	await sendEmail({
		to: booking.user.email,
		subject: "Your Booking Invoice",
		templateName: "invoice",
		templateData: invoiceData,
		attachments: [{ filename: "invoice.pdf", content: pdfBuffer, contentType: "application/pdf" }],
	});
};

const confirmPayment = async ({ transactionId, valId }: { transactionId?: string; valId?: string }) => {
	if (!transactionId || !valId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Missing payment reference.");
	}

	const payment = await Payment.findOne({ transactionId });

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
	}
	if (payment.status === PAYMENT_STATUS.PAID) {
		return { transactionId, amount: payment.amount, alreadyPaid: true };
	}
	if (payment.status !== PAYMENT_STATUS.UNPAID) {
		throw new AppError(httpStatus.BAD_REQUEST, "This payment is no longer active.");
	}

	const gateway = await SSLService.validatePayment(valId);

	if (!isPaymentVerified(gateway, transactionId, payment.amount)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment could not be verified.");
	}

	const session = await Booking.startSession();
	session.startTransaction();

	try {
		const updated = await Payment.updateOne(
			{ _id: payment._id, status: PAYMENT_STATUS.UNPAID },
			{ status: PAYMENT_STATUS.PAID, paymentGatewayData: gateway },
			{ session },
		);

		if (updated.modifiedCount === 0) {
			await session.abortTransaction();
			return { transactionId, amount: payment.amount, alreadyPaid: true };
		}

		await Booking.updateOne({ _id: payment.booking }, { status: BOOKING_STATUS.COMPLETE }, { session });
		await session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}

	sendInvoice(payment._id.toString()).catch((error: unknown) => {
		console.error("Invoice delivery failed", payment.transactionId, error);
	});

	return { transactionId, amount: payment.amount, alreadyPaid: false };
};

const closeUnpaidPayment = async (
	transactionId: string | undefined,
	paymentStatus: PAYMENT_STATUS.FAILED | PAYMENT_STATUS.CANCELLED,
	bookingStatus: BOOKING_STATUS.FAILED | BOOKING_STATUS.CANCEL,
) => {
	if (!transactionId) return;

	const payment = await Payment.findOneAndUpdate(
		{ transactionId, status: PAYMENT_STATUS.UNPAID },
		{ status: paymentStatus },
		{ new: true },
	);

	if (payment) {
		await Booking.updateOne({ _id: payment.booking, status: BOOKING_STATUS.PENDING }, { status: bookingStatus });
	}
};

const failPayment = (transactionId?: string) =>
	closeUnpaidPayment(transactionId, PAYMENT_STATUS.FAILED, BOOKING_STATUS.FAILED);

const cancelPayment = (transactionId?: string) =>
	closeUnpaidPayment(transactionId, PAYMENT_STATUS.CANCELLED, BOOKING_STATUS.CANCEL);

const getInvoiceDownloadUrl = async (paymentId: string, authUser: { userId: string; role: Role }) => {
	if (!isValidObjectId(paymentId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment id.");
	}

	const payment = await Payment.findById(paymentId)
		.select("invoiceUrl booking")
		.populate<{ booking: { user: Types.ObjectId } | null }>("booking", "user");

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
	}

	const isAdmin = authUser.role === Role.ADMIN || authUser.role === Role.SUPER_ADMIN;
	if (!isAdmin && payment.booking?.user.toString() !== authUser.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to view this invoice.");
	}
	if (!payment.invoiceUrl) {
		throw new AppError(httpStatus.NOT_FOUND, "Invoice is not ready yet.");
	}

	return payment.invoiceUrl;
};

export const PaymentService = {
	initPayment,
	confirmPayment,
	failPayment,
	cancelPayment,
	getInvoiceDownloadUrl,
};
