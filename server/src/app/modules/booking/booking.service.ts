/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { Tour } from "../tour/tour.model";
import { User } from "../user/user.model";
import { BOOKING_STATUS } from "./booking.interface";
import { Booking } from "./booking.model";
import type { TCreateBookingPayload } from "./booking.validation";

const createBooking = async (payload: TCreateBookingPayload, userId: string) => {
	const user = await User.findById(userId);

	if (!user?.phone || !user.address) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please update your profile (phone and address) to book a tour.");
	}

	const tour = await Tour.findById(payload.tour).select("costFrom");

	if (!tour) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
	}
	if (!tour.costFrom) {
		throw new AppError(httpStatus.BAD_REQUEST, "This tour has no price set yet.");
	}

	const amount = tour.costFrom * payload.guestCount;
	const transactionId = getTransactionId();

	const session = await Booking.startSession();
	session.startTransaction();

	try {
		const booking = await new Booking({
			user: userId,
			tour: payload.tour,
			guestCount: payload.guestCount,
			status: BOOKING_STATUS.PENDING,
		}).save({ session });

		const payment = await new Payment({
			booking: booking._id,
			transactionId,
			amount,
			status: PAYMENT_STATUS.UNPAID,
		}).save({ session });

		const updatedBooking = await Booking.findByIdAndUpdate(
			booking._id,
			{ payment: payment._id },
			{ new: true, runValidators: true, session },
		)
			.populate("tour", "title costFrom")
			.populate("payment");

		const paymentUrl = await SSLService.sslPaymentInit({
			name: user.name,
			email: user.email,
			phoneNumber: user.phone,
			address: user.address,
			amount,
			transactionId,
		});

		await session.commitTransaction();
		return { paymentUrl, booking: updatedBooking };
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};

const getUserBookings = async () => {
	return {};
};

const getBookingById = async () => {
	return {};
};

const updateBookingStatus = async () => {
	return {};
};

const getAllBookings = async () => {
	return {};
};

export const BookingService = {
	createBooking,
	getUserBookings,
	getBookingById,
	updateBookingStatus,
	getAllBookings,
};
