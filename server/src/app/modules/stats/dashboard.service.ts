import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Tour, TourType } from "../tour/tour.model";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";

const TIME_ZONE = "Asia/Dhaka";
const TZ_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDhakaDay = (date: Date) => {
	const local = new Date(date.getTime() + TZ_OFFSET_MS);
	return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - TZ_OFFSET_MS);
};

const toDayKey = (date: Date) => new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

const paidOn = { $ifNull: ["$paidAt", "$updatedAt"] };

const sumPaid = async (from: Date, to?: Date) => {
	const [result] = await Payment.aggregate<{ total: number }>([
		{ $match: { status: PAYMENT_STATUS.PAID } },
		{ $addFields: { paidOn } },
		{ $match: { paidOn: { $gte: from, ...(to && { $lt: to }) } } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
	]);
	return result?.total ?? 0;
};

const getToday = async (todayStart: Date) => {
	const tomorrow = new Date(todayStart.getTime() + DAY_MS);
	const departingTours = await Tour.find({ startDate: { $gte: todayStart, $lt: tomorrow } }).distinct("_id");

	const [newBookings, awaitingPayment, confirmed, cancelled, departingToday, collected] = await Promise.all([
		Booking.countDocuments({ createdAt: { $gte: todayStart } }),
		Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
		Payment.countDocuments({ status: PAYMENT_STATUS.PAID, paidAt: { $gte: todayStart } }),
		Booking.countDocuments({ status: BOOKING_STATUS.CANCEL, updatedAt: { $gte: todayStart } }),
		Booking.countDocuments({ status: BOOKING_STATUS.COMPLETE, tour: { $in: departingTours } }),
		sumPaid(todayStart),
	]);

	return { newBookings, awaitingPayment, confirmed, cancelled, departingToday, collected };
};

const getDailySeries = async (from: Date, days: number) => {
	const dayFormat = (field: unknown) => ({ $dateToString: { format: "%Y-%m-%d", date: field, timezone: TIME_ZONE } });

	const [bookings, revenue] = await Promise.all([
		Booking.aggregate<{ _id: string; count: number }>([
			{ $match: { createdAt: { $gte: from } } },
			{ $group: { _id: dayFormat("$createdAt"), count: { $sum: 1 } } },
		]),
		Payment.aggregate<{ _id: string; total: number }>([
			{ $match: { status: PAYMENT_STATUS.PAID } },
			{ $addFields: { paidOn } },
			{ $match: { paidOn: { $gte: from } } },
			{ $group: { _id: dayFormat("$paidOn"), total: { $sum: "$amount" } } },
		]),
	]);

	const bookingsByDay = new Map(bookings.map((row) => [row._id, row.count]));
	const revenueByDay = new Map(revenue.map((row) => [row._id, row.total]));

	return Array.from({ length: days }, (_, index) => {
		const date = toDayKey(new Date(from.getTime() + index * DAY_MS));
		return { date, bookings: bookingsByDay.get(date) ?? 0, revenue: revenueByDay.get(date) ?? 0 };
	});
};

const getByTourType = async (from: Date) => {
	const rows = await Booking.aggregate<{ _id: unknown; name: string; count: number }>([
		{ $match: { createdAt: { $gte: from } } },
		{ $lookup: { from: Tour.collection.name, localField: "tour", foreignField: "_id", as: "tour", pipeline: [{ $project: { tourType: 1 } }] } },
		{ $unwind: "$tour" },
		{ $group: { _id: "$tour.tourType", count: { $sum: 1 } } },
		{ $lookup: { from: TourType.collection.name, localField: "_id", foreignField: "_id", as: "type" } },
		{ $unwind: "$type" },
		{ $project: { _id: 1, count: 1, name: "$type.name" } },
		{ $sort: { count: -1 } },
	]);

	const total = rows.reduce((sum, row) => sum + row.count, 0);
	return rows.map((row) => ({ ...row, percent: total ? Math.round((row.count / total) * 100) : 0 }));
};

const getByTour = async (from: Date, limit = 10) => {
	const rows = await Booking.aggregate<{
		_id: unknown;
		title: string;
		slug: string;
		maxGuest?: number;
		bookings: number;
		guests: number;
		revenue: number;
		cancelled: number;
	}>([
		{ $match: { createdAt: { $gte: from } } },
		{ $lookup: { from: Payment.collection.name, localField: "payment", foreignField: "_id", as: "payment", pipeline: [{ $project: { amount: 1, status: 1 } }] } },
		{ $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: "$tour",
				bookings: { $sum: 1 },
				guests: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.COMPLETE] }, "$guestCount", 0] } },
				revenue: { $sum: { $cond: [{ $eq: ["$payment.status", PAYMENT_STATUS.PAID] }, "$payment.amount", 0] } },
				cancelled: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CANCEL] }, 1, 0] } },
			},
		},
		{ $sort: { revenue: -1, bookings: -1 } },
		{ $limit: limit },
		{ $lookup: { from: Tour.collection.name, localField: "_id", foreignField: "_id", as: "tour", pipeline: [{ $project: { title: 1, slug: 1, maxGuest: 1 } }] } },
		{ $unwind: "$tour" },
		{ $project: { bookings: 1, guests: 1, revenue: 1, cancelled: 1, title: "$tour.title", slug: "$tour.slug", maxGuest: "$tour.maxGuest" } },
	]);

	return rows.map(({ maxGuest, ...row }) => ({
		...row,
		seatsFilled: maxGuest ? Math.min(100, Math.round((row.guests / maxGuest) * 100)) : null,
	}));
};

export const getDashboardStats = async (days: 7 | 14 | 30) => {
	const now = new Date();
	const todayStart = startOfDhakaDay(now);
	const periodStart = new Date(todayStart.getTime() - (days - 1) * DAY_MS);

	const [today, series, revenue, bookings, newTravellers, awaitingPayment, byTourType, byTour] = await Promise.all([
		getToday(todayStart),
		getDailySeries(periodStart, days),
		sumPaid(periodStart),
		Booking.countDocuments({ createdAt: { $gte: periodStart } }),
		User.countDocuments({ role: Role.USER, createdAt: { $gte: periodStart } }),
		Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
		getByTourType(periodStart),
		getByTour(periodStart),
	]);

	return {
		period: { days, from: toDayKey(periodStart), to: toDayKey(todayStart), timeZone: TIME_ZONE },
		today,
		series,
		totals: { revenue, bookings, newTravellers, awaitingPayment },
		byTourType,
		byTour,
	};
};

export const getPublicStats = async () => {
	const now = new Date();
	const local = new Date(now.getTime() + TZ_OFFSET_MS);
	const monthStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - TZ_OFFSET_MS);
	const nextMonthStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - TZ_OFFSET_MS);

	const [tours, divisionsWithTours, departuresThisMonth, largestGroup] = await Promise.all([
		Tour.countDocuments(),
		Tour.distinct("division"),
		Tour.countDocuments({ startDate: { $gte: monthStart, $lt: nextMonthStart } }),
		Tour.findOne({ maxGuest: { $gt: 0 } }).sort("-maxGuest").select("maxGuest").lean(),
	]);

	return {
		tours,
		divisions: divisionsWithTours.length,
		departuresThisMonth,
		maxGroupSize: largestGroup?.maxGuest ?? null,
	};
};
