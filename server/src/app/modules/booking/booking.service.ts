import httpStatus from "http-status-codes";
import { isValidObjectId, Types, type PipelineStage } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { Tour } from "../tour/tour.model";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { ADMIN_STATUS_TRANSITIONS } from "./booking.constant";
import { BOOKING_STATUS } from "./booking.interface";
import { Booking } from "./booking.model";
import type {
	TAllBookingsQuery,
	TBookingSummaryQuery,
	TCreateBookingPayload,
	TMyBookingsQuery,
} from "./booking.validation";

interface IAuthUser {
	userId: string;
	role: Role;
}

const TOUR_CARD_FIELDS = "title slug images location startDate endDate costFrom";
const PAYMENT_FIELDS = "transactionId amount status invoiceUrl createdAt updatedAt";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertObjectId = (id: string, label = "booking") => {
	if (!isValidObjectId(id)) {
		throw new AppError(httpStatus.BAD_REQUEST, `Invalid ${label} id.`);
	}
};

const buildDateFilter = (from?: Date, to?: Date) => {
	if (!from && !to) return {};
	const createdAt: Record<string, Date> = {};
	if (from) createdAt.$gte = from;
	if (to) createdAt.$lte = to;
	return { createdAt };
};

const createBooking = async (payload: TCreateBookingPayload, userId: string) => {
	const user = await User.findById(userId);

	if (!user?.phone || !user.address) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please update your profile (phone and address) to book a tour.");
	}

	const tour = await Tour.findById(payload.tour).select("costFrom startDate maxGuest");

	if (!tour) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
	}
	if (!tour.costFrom) {
		throw new AppError(httpStatus.BAD_REQUEST, "This tour has no price set yet.");
	}
	if (tour.startDate && tour.startDate < new Date()) {
		throw new AppError(httpStatus.BAD_REQUEST, "This tour has already started.");
	}
	if (tour.maxGuest && payload.guestCount > tour.maxGuest) {
		throw new AppError(httpStatus.BAD_REQUEST, `This tour allows at most ${tour.maxGuest} guests per booking.`);
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

const getUserBookings = async (userId: string, query: TMyBookingsQuery) => {
	const filter = { user: userId, ...(query.status && { status: query.status }) };
	const skip = (query.page - 1) * query.limit;

	const [data, total] = await Promise.all([
		Booking.find(filter)
			.sort("-createdAt")
			.skip(skip)
			.limit(query.limit)
			.populate("tour", TOUR_CARD_FIELDS)
			.populate("payment", PAYMENT_FIELDS),
		Booking.countDocuments(filter),
	]);

	return {
		data,
		meta: { page: query.page, limit: query.limit, total, totalPage: Math.ceil(total / query.limit) },
	};
};

const getUserBookingSummary = async (userId: string) => {
	const bookings = await Booking.find({ user: userId })
		.select("status tour payment")
		.populate<{ tour: { startDate?: Date; endDate?: Date } | null }>("tour", "startDate endDate")
		.populate<{ payment: { amount: number; status: PAYMENT_STATUS } | null }>("payment", "amount status")
		.lean();

	const now = new Date();
	const counts: Record<string, number> = { ALL: bookings.length };
	for (const status of Object.values(BOOKING_STATUS)) counts[status] = 0;

	let upcomingTrips = 0;
	let completedTrips = 0;
	let pendingAmount = 0;
	let totalSpent = 0;

	for (const booking of bookings) {
		counts[booking.status] = (counts[booking.status] ?? 0) + 1;

		if (booking.status === BOOKING_STATUS.COMPLETE) {
			const tripEnd = booking.tour?.endDate ?? booking.tour?.startDate;
			if (tripEnd && tripEnd < now) completedTrips++;
			else upcomingTrips++;
		}
		if (booking.status === BOOKING_STATUS.PENDING && booking.payment?.status === PAYMENT_STATUS.UNPAID) {
			pendingAmount += booking.payment.amount;
		}
		if (booking.payment?.status === PAYMENT_STATUS.PAID) {
			totalSpent += booking.payment.amount;
		}
	}

	return { counts, upcomingTrips, completedTrips, pendingAmount, totalSpent };
};

const getBookingById = async (bookingId: string, authUser: IAuthUser) => {
	assertObjectId(bookingId);

	const booking = await Booking.findById(bookingId)
		.populate({
			path: "tour",
			select: `${TOUR_CARD_FIELDS} departureLocation arrivalLocation maxGuest division tourType`,
			populate: [
				{ path: "division", select: "name slug" },
				{ path: "tourType", select: "name" },
			],
		})
		.populate("user", "name email phone address")
		.populate("payment", PAYMENT_FIELDS);

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}

	const isAdmin = authUser.role === Role.ADMIN || authUser.role === Role.SUPER_ADMIN;
	const ownerId = (booking.user as unknown as { _id: Types.ObjectId })._id.toString();

	if (!isAdmin && ownerId !== authUser.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to view this booking.");
	}

	return booking;
};

const getAllBookings = async (query: TAllBookingsQuery) => {
	const match: Record<string, unknown> = {
		...buildDateFilter(query.from, query.to),
		...(query.status && { status: query.status }),
	};

	const pipeline: PipelineStage[] = [
		{ $match: match },
		{
			$lookup: {
				from: User.collection.name,
				localField: "user",
				foreignField: "_id",
				as: "user",
				pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
			},
		},
		{ $unwind: "$user" },
		{
			$lookup: {
				from: Tour.collection.name,
				localField: "tour",
				foreignField: "_id",
				as: "tour",
				pipeline: [{ $project: { title: 1, slug: 1, startDate: 1, endDate: 1 } }],
			},
		},
		{ $unwind: "$tour" },
		{
			$lookup: {
				from: Payment.collection.name,
				localField: "payment",
				foreignField: "_id",
				as: "payment",
				pipeline: [{ $project: { transactionId: 1, amount: 1, status: 1 } }],
			},
		},
		{ $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
	];

	if (query.searchTerm) {
		const regex = { $regex: escapeRegex(query.searchTerm), $options: "i" };
		const or: Record<string, unknown>[] = [
			{ bookingCode: regex },
			{ "payment.transactionId": regex },
			{ "user.name": regex },
			{ "user.email": regex },
			{ "tour.title": regex },
		];
		if (isValidObjectId(query.searchTerm)) {
			or.push({ _id: new Types.ObjectId(query.searchTerm) });
		}
		pipeline.push({ $match: { $or: or } });
	}

	const skip = (query.page - 1) * query.limit;

	pipeline.push(
		{ $sort: { createdAt: -1 } },
		{
			$facet: {
				data: [{ $skip: skip }, { $limit: query.limit }],
				total: [{ $count: "count" }],
			},
		},
	);

	const [result] = await Booking.aggregate<{ data: unknown[]; total: { count: number }[] }>(pipeline);
	const total = result?.total[0]?.count ?? 0;

	return {
		data: result?.data ?? [],
		meta: { page: query.page, limit: query.limit, total, totalPage: Math.ceil(total / query.limit) },
	};
};

const getBookingSummary = async (query: TBookingSummaryQuery) => {
	const grouped = await Booking.aggregate<{ _id: BOOKING_STATUS; count: number }>([
		{ $match: buildDateFilter(query.from, query.to) },
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);

	const counts: Record<string, number> = {};
	for (const status of Object.values(BOOKING_STATUS)) counts[status] = 0;
	let all = 0;
	for (const { _id, count } of grouped) {
		counts[_id] = count;
		all += count;
	}
	counts.ALL = all;

	return { counts };
};

const cancelMyBooking = async (bookingId: string, userId: string) => {
	assertObjectId(bookingId);

	const booking = await Booking.findOne({ _id: bookingId, user: userId });

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}
	if (booking.status !== BOOKING_STATUS.PENDING) {
		throw new AppError(httpStatus.BAD_REQUEST, "Only unpaid (pending) bookings can be cancelled.");
	}

	const session = await Booking.startSession();
	session.startTransaction();

	try {
		booking.status = BOOKING_STATUS.CANCEL;
		await booking.save({ session });
		await Payment.updateOne(
			{ booking: booking._id, status: PAYMENT_STATUS.UNPAID },
			{ status: PAYMENT_STATUS.CANCELLED },
			{ session },
		);

		await session.commitTransaction();
		return booking;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};

const updateBookingStatus = async (bookingId: string, status: BOOKING_STATUS) => {
	assertObjectId(bookingId);

	const booking = await Booking.findById(bookingId).populate<{
		payment: { _id: Types.ObjectId; status: PAYMENT_STATUS } | null;
	}>("payment", "status");

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}

	const allowed = ADMIN_STATUS_TRANSITIONS[booking.status];
	if (!allowed.includes(status)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot change a ${booking.status} booking to ${status}.${allowed.length ? ` Allowed: ${allowed.join(", ")}.` : ""}`,
		);
	}

	const paymentStatusMap: Partial<Record<PAYMENT_STATUS, PAYMENT_STATUS>> = {
		[PAYMENT_STATUS.UNPAID]: PAYMENT_STATUS.CANCELLED,
		[PAYMENT_STATUS.PAID]: PAYMENT_STATUS.REFUNDED,
	};
	const nextPaymentStatus = booking.payment ? paymentStatusMap[booking.payment.status] : undefined;

	const session = await Booking.startSession();
	session.startTransaction();

	try {
		if (booking.payment && nextPaymentStatus) {
			await Payment.updateOne({ _id: booking.payment._id }, { status: nextPaymentStatus }, { session });
		}

		const updated = await Booking.findByIdAndUpdate(
			bookingId,
			{ status },
			{ new: true, runValidators: true, session },
		).populate("payment", PAYMENT_FIELDS);

		await session.commitTransaction();
		return updated;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};

export const BookingService = {
	createBooking,
	getUserBookings,
	getUserBookingSummary,
	getBookingById,
	getAllBookings,
	getBookingSummary,
	cancelMyBooking,
	updateBookingStatus,
};
