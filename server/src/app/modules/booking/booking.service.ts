import httpStatus from "http-status-codes";
import { isValidObjectId, Types, type PipelineStage } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { Tour } from "../tour/tour.model";
import { GUIDE_APPLICATION_STATUS } from "../guideApplication/guideApplication.interface";
import { GuideApplication } from "../guideApplication/guideApplication.model";
import { IsActive, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { ADMIN_STATUS_TRANSITIONS, paymentHoldCutoff } from "./booking.constant";
import { BOOKING_STATUS } from "./booking.interface";
import { Booking } from "./booking.model";
import type {
	TAllBookingsQuery,
	TAssignedBookingsQuery,
	TBookingExportQuery,
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

export const countBookedSeats = async (tourId: Types.ObjectId | string) => {
	const [result] = await Booking.aggregate<{ seats: number }>([
		{
			$match: {
				tour: new Types.ObjectId(String(tourId)),
				$or: [
					{ status: BOOKING_STATUS.COMPLETE },
					{ status: BOOKING_STATUS.PENDING, updatedAt: { $gte: paymentHoldCutoff() } },
				],
			},
		},
		{ $group: { _id: null, seats: { $sum: "$guestCount" } } },
	]);
	return result?.seats ?? 0;
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
	if (tour.maxGuest) {
		const seatsLeft = tour.maxGuest - (await countBookedSeats(tour._id));
		if (payload.guestCount > seatsLeft) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				seatsLeft > 0 ? `Only ${seatsLeft} seat(s) left on this tour.` : "This tour is fully booked.",
			);
		}
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

const GUIDE_CONTACT_WINDOW_MS = 48 * 60 * 60 * 1000;

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
		.populate("guide", "name email phone picture")
		.populate("payment", PAYMENT_FIELDS)
		.lean();

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}

	const isAdmin = authUser.role === Role.ADMIN || authUser.role === Role.SUPER_ADMIN;
	const ownerId = (booking.user as unknown as { _id: Types.ObjectId })._id.toString();
	const guide = booking.guide as unknown as { _id: Types.ObjectId; phone?: string; email?: string } | null;
	const isAssignedGuide = guide?._id.toString() === authUser.userId;

	if (!isAdmin && !isAssignedGuide && ownerId !== authUser.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to view this booking.");
	}

	if (guide && !isAdmin && !isAssignedGuide) {
		const startDate = (booking.tour as unknown as { startDate?: Date } | null)?.startDate;
		const contactShared = !startDate || startDate.getTime() - Date.now() <= GUIDE_CONTACT_WINDOW_MS;
		if (!contactShared) {
			delete guide.phone;
			delete guide.email;
		}
		Object.assign(guide, { contactShared });
	}

	return booking;
};

const buildAdminBookingsPipeline = (query: TBookingExportQuery): PipelineStage[] => {
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
		{
			$lookup: {
				from: User.collection.name,
				localField: "guide",
				foreignField: "_id",
				as: "guide",
				pipeline: [{ $project: { name: 1 } }],
			},
		},
		{ $unwind: { path: "$guide", preserveNullAndEmptyArrays: true } },
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

	return pipeline;
};

const getAllBookings = async (query: TAllBookingsQuery) => {
	const pipeline = buildAdminBookingsPipeline(query);

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

const CSV_EXPORT_LIMIT = 5000;

const csvCell = (value: unknown) => {
	let text = value === null || value === undefined ? "" : String(value);
	if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const formatDate = (value?: Date) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const exportBookingsCsv = async (query: TBookingExportQuery) => {
	const pipeline = buildAdminBookingsPipeline(query);
	pipeline.push({ $sort: { createdAt: -1 } }, { $limit: CSV_EXPORT_LIMIT });

	const rows = await Booking.aggregate<{
		bookingCode?: string;
		createdAt?: Date;
		status: string;
		guestCount: number;
		user: { name: string; email: string; phone?: string };
		tour: { title: string; startDate?: Date; endDate?: Date };
		payment?: { transactionId: string; amount: number; status: string };
		guide?: { name: string };
	}>(pipeline);

	const header = [
		"Booking code",
		"Created",
		"Status",
		"Traveller",
		"Email",
		"Phone",
		"Tour",
		"Trip start",
		"Trip end",
		"Guests",
		"Amount (BDT)",
		"Payment status",
		"Transaction ID",
		"Guide",
	];

	const lines = rows.map((row) =>
		[
			row.bookingCode,
			formatDate(row.createdAt),
			row.status,
			row.user.name,
			row.user.email,
			row.user.phone,
			row.tour.title,
			formatDate(row.tour.startDate),
			formatDate(row.tour.endDate),
			row.guestCount,
			row.payment?.amount,
			row.payment?.status,
			row.payment?.transactionId,
			row.guide?.name,
		]
			.map(csvCell)
			.join(","),
	);

	return { csv: `\uFEFF${[header.join(","), ...lines].join("\r\n")}`, count: rows.length };
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

interface ITourWindow {
	_id: Types.ObjectId;
	title?: string;
	division?: Types.ObjectId;
	startDate?: Date;
	endDate?: Date;
}

const tourRange = (tour: ITourWindow | null) => {
	if (!tour?.startDate) return null;
	return { start: tour.startDate.getTime(), end: (tour.endDate ?? tour.startDate).getTime() };
};

const findGuideConflicts = async (guideIds: Types.ObjectId[], booking: { _id: Types.ObjectId }, tour: ITourWindow) => {
	const range = tourRange(tour);
	const conflicts = new Map<string, string>();
	if (!range || guideIds.length === 0) return conflicts;

	const others = await Booking.find({
		guide: { $in: guideIds },
		status: BOOKING_STATUS.COMPLETE,
		_id: { $ne: booking._id },
		tour: { $ne: tour._id },
	})
		.select("guide tour")
		.populate<{ tour: ITourWindow | null }>("tour", "title startDate endDate")
		.lean();

	for (const other of others) {
		const otherRange = tourRange(other.tour);
		if (otherRange && otherRange.start <= range.end && range.start <= otherRange.end && other.guide) {
			conflicts.set(other.guide.toString(), other.tour?.title ?? "another tour");
		}
	}

	return conflicts;
};

const loadAssignableBooking = async (bookingId: string) => {
	assertObjectId(bookingId);

	const booking = await Booking.findById(bookingId)
		.select("status tour guide")
		.populate<{ tour: ITourWindow | null }>("tour", "title division startDate endDate")
		.lean();

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
	}
	if (booking.status !== BOOKING_STATUS.COMPLETE) {
		throw new AppError(httpStatus.BAD_REQUEST, "A guide can only be assigned to a paid (COMPLETE) booking.");
	}
	if (!booking.tour?.division) {
		throw new AppError(httpStatus.BAD_REQUEST, "This booking's tour has no division.");
	}

	return booking as typeof booking & { tour: ITourWindow & { division: Types.ObjectId } };
};

const getAvailableGuides = async (bookingId: string) => {
	const booking = await loadAssignableBooking(bookingId);

	const applications = await GuideApplication.find({
		division: booking.tour.division,
		status: GUIDE_APPLICATION_STATUS.APPROVED,
	})
		.select("user experienceYears languages")
		.lean();

	const guides = await User.find({
		_id: { $in: applications.map((application) => application.user) },
		role: Role.GUIDE,
		isActive: IsActive.ACTIVE,
	})
		.where("isDeleted")
		.ne(true)
		.select("name email phone picture")
		.lean();

	const conflicts = await findGuideConflicts(
		guides.map((guide) => guide._id),
		booking,
		booking.tour,
	);
	const profileByUser = new Map(applications.map((application) => [application.user.toString(), application]));
	const currentGuide = booking.guide?.toString() ?? null;

	const data = guides
		.map((guide) => {
			const id = guide._id.toString();
			const profile = profileByUser.get(id);
			return {
				...guide,
				experienceYears: profile?.experienceYears ?? 0,
				languages: profile?.languages ?? [],
				isAssigned: id === currentGuide,
				isAvailable: !conflicts.has(id),
				conflictWith: conflicts.get(id) ?? null,
			};
		})
		.sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || b.experienceYears - a.experienceYears);

	return { currentGuide, guides: data };
};

const assignGuide = async (bookingId: string, guideId: string | null) => {
	const booking = await loadAssignableBooking(bookingId);

	if (guideId) {
		const [guide, approved] = await Promise.all([
			User.findOne({ _id: guideId, role: Role.GUIDE, isActive: IsActive.ACTIVE }).where("isDeleted").ne(true).select("_id").lean(),
			GuideApplication.exists({
				user: guideId,
				division: booking.tour.division,
				status: GUIDE_APPLICATION_STATUS.APPROVED,
			}),
		]);

		if (!guide) {
			throw new AppError(httpStatus.BAD_REQUEST, "This user is not an active guide.");
		}
		if (!approved) {
			throw new AppError(httpStatus.BAD_REQUEST, "This guide is not approved for this tour's division.");
		}

		const conflicts = await findGuideConflicts([guide._id], booking, booking.tour);
		const conflict = conflicts.get(guide._id.toString());
		if (conflict) {
			throw new AppError(httpStatus.CONFLICT, `This guide is already leading "${conflict}" on overlapping dates.`);
		}
	}

	return Booking.findByIdAndUpdate(
		bookingId,
		{ guide: guideId, guideAssignedAt: guideId ? new Date() : null },
		{ new: true, runValidators: true },
	)
		.populate("guide", "name email phone picture")
		.populate("tour", "title startDate endDate");
};

const getAssignedBookings = async (guideId: string, query: TAssignedBookingsQuery) => {
	const filter: Record<string, unknown> = { guide: guideId, status: BOOKING_STATUS.COMPLETE };

	if (query.scope !== "all") {
		const now = new Date();
		const upcoming = { $or: [{ endDate: { $gte: now } }, { endDate: null, startDate: { $gte: now } }] };
		const past = { $or: [{ endDate: { $lt: now } }, { endDate: null, startDate: { $lt: now } }] };
		filter.tour = { $in: await Tour.find(query.scope === "upcoming" ? upcoming : past).distinct("_id") };
	}

	const skip = (query.page - 1) * query.limit;

	const [data, total] = await Promise.all([
		Booking.find(filter)
			.sort("-createdAt")
			.skip(skip)
			.limit(query.limit)
			.select("bookingCode tour user guestCount status guideAssignedAt createdAt")
			.populate({
				path: "tour",
				select: `${TOUR_CARD_FIELDS} departureLocation arrivalLocation division`,
				populate: { path: "division", select: "name" },
			})
			.populate("user", "name phone email")
			.lean(),
		Booking.countDocuments(filter),
	]);

	return {
		data,
		meta: { page: query.page, limit: query.limit, total, totalPage: Math.ceil(total / query.limit) },
	};
};

const expireStalePendingBookings = async () => {
	const stale = await Booking.find({ status: BOOKING_STATUS.PENDING, updatedAt: { $lt: paymentHoldCutoff() } })
		.select("_id")
		.limit(500)
		.lean();

	if (stale.length === 0) return 0;

	const ids = stale.map((booking) => booking._id);
	const now = new Date();

	await Promise.all([
		Booking.updateMany(
			{ _id: { $in: ids }, status: BOOKING_STATUS.PENDING },
			{ status: BOOKING_STATUS.CANCEL, expiredAt: now },
		),
		Payment.updateMany({ booking: { $in: ids }, status: PAYMENT_STATUS.UNPAID }, { status: PAYMENT_STATUS.CANCELLED }),
	]);

	return ids.length;
};

export const BookingService = {
	expireStalePendingBookings,
	exportBookingsCsv,
	getAvailableGuides,
	assignGuide,
	getAssignedBookings,
	createBooking,
	getUserBookings,
	getUserBookingSummary,
	getBookingById,
	getAllBookings,
	getBookingSummary,
	cancelMyBooking,
	updateBookingStatus,
};
