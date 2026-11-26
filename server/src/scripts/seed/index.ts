/* eslint-disable no-console */
import bcryptjs from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { envVars, isProduction } from "../../app/config/env";
import { generateBookingCode } from "../../app/modules/booking/booking.constant";
import { BOOKING_STATUS } from "../../app/modules/booking/booking.interface";
import { Booking } from "../../app/modules/booking/booking.model";
import { Division } from "../../app/modules/division/division.model";
import { GUIDE_APPLICATION_STATUS } from "../../app/modules/guideApplication/guideApplication.interface";
import { GuideApplication } from "../../app/modules/guideApplication/guideApplication.model";
import { PAYMENT_STATUS } from "../../app/modules/payment/payment.interface";
import { Payment } from "../../app/modules/payment/payment.model";
import { Tour, TourType } from "../../app/modules/tour/tour.model";
import { IsActive, Role } from "../../app/modules/user/user.interface";
import { User } from "../../app/modules/user/user.model";
import { getTransactionId } from "../../app/utils/getTransactionId";
import {
	bookings,
	DEMO_EMAIL_DOMAIN,
	divisions,
	guideApplications,
	tours,
	tourTypes,
	users,
	type TSeedUserKey,
} from "./data";
import { resolveImage, resolveImages } from "./images";

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DEPARTURE_HOUR = 8;

const args = new Set(process.argv.slice(2));
const FRESH = args.has("--fresh");
const UPLOAD = !args.has("--no-upload");

const now = new Date();
const daysAgo = (days: number, extraMinutes = 0) => new Date(now.getTime() - days * DAY_MS + extraMinutes * 60 * 1000);
const todayDhaka = Math.floor((now.getTime() + DHAKA_OFFSET_MS) / DAY_MS) * DAY_MS - DHAKA_OFFSET_MS;
const tripStart = (inDays: number) => new Date(todayDhaka + inDays * DAY_MS + DEPARTURE_HOUR * 60 * 60 * 1000);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const byName = (name: string) => ({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });

const must = <T>(map: Map<string, T>, key: string, label: string) => {
	const value = map.get(key);
	if (value === undefined) throw new Error(`Seed data error: unknown ${label} "${key}"`);
	return value;
};

const demoEmailFilter = { email: { $regex: `@${escapeRegex(DEMO_EMAIL_DOMAIN)}$`, $options: "i" } };

const wipeDemoData = async () => {
	if (isProduction && !args.has("--force")) {
		throw new Error("--fresh deletes data. On production add --force if you really mean it.");
	}

	const [demoUsers, demoTours] = await Promise.all([
		User.find(demoEmailFilter).select("_id").lean(),
		Tour.find({ title: { $in: tours.map((tour) => tour.title) } }).select("_id").lean(),
	]);
	const userIds = demoUsers.map((user) => user._id);
	const tourIds = demoTours.map((tour) => tour._id);

	const demoBookings = await Booking.find({ $or: [{ user: { $in: userIds } }, { tour: { $in: tourIds } }] })
		.select("_id")
		.lean();
	const bookingIds = demoBookings.map((booking) => booking._id);

	const [payments, bookingsDeleted, applications, toursDeleted, usersDeleted] = await Promise.all([
		Payment.deleteMany({ booking: { $in: bookingIds } }),
		Booking.deleteMany({ _id: { $in: bookingIds } }),
		GuideApplication.deleteMany({ user: { $in: userIds } }),
		Tour.deleteMany({ _id: { $in: tourIds } }),
		User.deleteMany({ _id: { $in: userIds } }),
	]);

	console.log(
		`Removed demo data: ${usersDeleted.deletedCount} users, ${toursDeleted.deletedCount} tours, ` +
			`${bookingsDeleted.deletedCount} bookings, ${payments.deletedCount} payments, ${applications.deletedCount} guide applications`,
	);
};

const seedSuperAdmin = async (hash: (plain: string) => Promise<string>) => {
	const { SUPER_ADMIN_EMAIL: email, SUPER_ADMIN_PASSWORD: password } = envVars;
	if (!email || !password) {
		console.log("SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin");
		return null;
	}

	const existing = await User.findOne({ email }).select("_id").lean();
	if (existing) return existing._id;

	const created = await User.create({
		name: "Super admin",
		email,
		password: await hash(password),
		role: Role.SUPER_ADMIN,
		isVerified: true,
		auths: [{ provider: "credentials", providerId: email }],
	});
	console.log(`Super admin created: ${email}`);
	return created._id;
};

const seedDivisions = async () => {
	const ids = new Map<string, Types.ObjectId>();

	for (const item of divisions) {
		const existing = await Division.findOne(byName(item.name)).select("_id").lean();
		if (existing) {
			ids.set(item.name, existing._id);
			continue;
		}
		const created = await Division.create({ name: item.name, description: item.description });
		ids.set(item.name, created._id);
	}

	console.log(`Divisions ready: ${ids.size}`);
	return ids;
};

const seedTourTypes = async () => {
	const ids = new Map<string, Types.ObjectId>();

	for (const name of tourTypes) {
		const existing = await TourType.findOne(byName(name)).select("_id").lean();
		ids.set(name, existing?._id ?? (await TourType.create({ name }))._id);
	}

	console.log(`Tour types ready: ${ids.size}`);
	return ids;
};

const seedUsers = async (hash: (plain: string) => Promise<string>) => {
	const password = await hash(envVars.SEED_DEMO_PASSWORD ?? "Tourly@2026");
	const ids = new Map<TSeedUserKey, Types.ObjectId>();
	const toInsert = [];

	for (const user of users) {
		const existing = await User.findOne({ email: user.email }).select("_id").lean();
		if (existing) {
			ids.set(user.key, existing._id);
			continue;
		}

		const _id = new Types.ObjectId();
		const joinedAt = daysAgo(user.joinedDaysAgo);
		ids.set(user.key, _id);
		toInsert.push({
			_id,
			name: user.name,
			email: user.email,
			password,
			role: user.role,
			phone: user.phone,
			address: user.address,
			isDeleted: false,
			isActive: user.isActive ?? IsActive.ACTIVE,
			isVerified: true,
			auths: [{ provider: "credentials", providerId: user.email }],
			createdAt: joinedAt,
			updatedAt: joinedAt,
		});
	}

	// raw insert keeps the back-dated createdAt (for the "new users" charts)
	if (toInsert.length > 0) await User.collection.insertMany(toInsert);
	console.log(`Demo users ready: ${ids.size} (${toInsert.length} new)`);
	return ids;
};

const seedTours = async (divisionIds: Map<string, Types.ObjectId>, typeIds: Map<string, Types.ObjectId>) => {
	const ids = new Map<string, { _id: Types.ObjectId; costFrom: number }>();
	let created = 0;

	for (const item of tours) {
		const existing = await Tour.findOne({ title: item.title }).select("_id costFrom").lean();
		if (existing) {
			if (item.autoRollover) await Tour.updateOne({ _id: existing._id }, { $set: { autoRollover: true } });
			ids.set(item.key, { _id: existing._id, costFrom: existing.costFrom ?? item.costFrom });
			continue;
		}

		console.log(`  Tour: ${item.title}`);
		const startDate = tripStart(item.startInDays);
		const endDate = new Date(startDate.getTime() + (item.days - 1) * DAY_MS + 10 * 60 * 60 * 1000);

		const tour = await Tour.create({
			title: item.title,
			description: item.description,
			images: await resolveImages(item.images, UPLOAD),
			location: item.location,
			departureLocation: item.departureLocation,
			arrivalLocation: item.arrivalLocation,
			costFrom: item.costFrom,
			startDate,
			endDate,
			included: item.included,
			excluded: item.excluded,
			amenities: item.amenities,
			tourPlan: item.tourPlan,
			maxGuest: item.maxGuest,
			minAge: item.minAge,
			division: must(divisionIds, item.division, "division"),
			tourType: must(typeIds, item.tourType, "tour type"),
			autoRollover: item.autoRollover,
		});

		ids.set(item.key, { _id: tour._id, costFrom: item.costFrom });
		created++;
	}

	console.log(`Tours ready: ${ids.size} (${created} new)`);
	return ids;
};

const seedDivisionThumbnails = async (divisionIds: Map<string, Types.ObjectId>) => {
	for (const [name, _id] of divisionIds) {
		const division = await Division.findById(_id).select("thumbnail").lean();
		if (division?.thumbnail) continue;

		const photoId = tours.find((tour) => tour.division === name && tour.autoRollover)?.images[0];
		if (!photoId) continue;

		await Division.updateOne({ _id }, { $set: { thumbnail: await resolveImage(photoId, UPLOAD) } });
	}
};

const seedGuideApplications = async (userIds: Map<TSeedUserKey, Types.ObjectId>, divisionIds: Map<string, Types.ObjectId>) => {
	const reviewer = must(userIds, "admin", "user");
	const docs = guideApplications.map((item) => {
		const createdAt = daysAgo(item.daysAgo);
		const reviewed = item.status !== "PENDING";
		const reviewedAt = reviewed ? new Date(createdAt.getTime() + DAY_MS) : undefined;

		return {
			_id: new Types.ObjectId(),
			user: must(userIds, item.user, "user"),
			division: must(divisionIds, item.division, "division"),
			experienceYears: item.experienceYears,
			languages: item.languages,
			message: item.message,
			status: GUIDE_APPLICATION_STATUS[item.status],
			...(reviewed && { reviewedBy: reviewer, reviewedAt }),
			...(item.reviewNote && { reviewNote: item.reviewNote }),
			createdAt,
			updatedAt: reviewedAt ?? createdAt,
		};
	});

	await GuideApplication.collection.insertMany(docs);

	for (const doc of docs) {
		if (doc.status !== GUIDE_APPLICATION_STATUS.APPROVED || !doc.reviewedAt) continue;
		await User.collection.updateOne(
			{ _id: doc.user },
			{ $set: { roleChange: { by: reviewer, at: doc.reviewedAt, via: "GUIDE_APPLICATION" } } },
		);
	}

	console.log(`Guide applications: ${docs.length}`);
};

const seedBookings = async (
	userIds: Map<TSeedUserKey, Types.ObjectId>,
	tourIds: Map<string, { _id: Types.ObjectId; costFrom: number }>,
) => {
	const bookingDocs = [];
	const paymentDocs = [];

	for (const [index, item] of bookings.entries()) {
		const tour = must(tourIds, item.tour, "tour");
		const bookingId = new Types.ObjectId();
		const paymentId = new Types.ObjectId();
		const createdAt = daysAgo(item.daysAgo, -(index * 37) % 600);
		const settledAt = new Date(createdAt.getTime() + 6 * 60 * 1000);
		const guide = item.guide ? must(userIds, item.guide, "user") : null;

		const status = BOOKING_STATUS[item.status];
		const paymentStatus = {
			[BOOKING_STATUS.COMPLETE]: PAYMENT_STATUS.PAID,
			[BOOKING_STATUS.CANCEL]: PAYMENT_STATUS.CANCELLED,
			[BOOKING_STATUS.FAILED]: PAYMENT_STATUS.FAILED,
			[BOOKING_STATUS.PENDING]: PAYMENT_STATUS.UNPAID,
		}[status];

		bookingDocs.push({
			_id: bookingId,
			bookingCode: generateBookingCode(createdAt),
			user: must(userIds, item.user, "user"),
			tour: tour._id,
			payment: paymentId,
			guide,
			guideAssignedAt: guide ? new Date(settledAt.getTime() + DAY_MS / 2) : null,
			expiredAt: status === BOOKING_STATUS.CANCEL ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null,
			guestCount: item.guests,
			status,
			createdAt,
			updatedAt: settledAt,
		});

		paymentDocs.push({
			_id: paymentId,
			booking: bookingId,
			transactionId: getTransactionId(),
			amount: tour.costFrom * item.guests,
			status: paymentStatus,
			paymentGatewayData: { seeded: true },
			...(paymentStatus === PAYMENT_STATUS.PAID && { paidAt: settledAt }),
			createdAt,
			updatedAt: settledAt,
		});
	}

	await Booking.collection.insertMany(bookingDocs);
	await Payment.collection.insertMany(paymentDocs);
	console.log(`Bookings: ${bookingDocs.length} (with payments)`);
};

const run = async () => {
	try {
		await mongoose.connect(envVars.DB_URL);
		console.log(`Seeding demo data${FRESH ? " (fresh)" : ""}${UPLOAD ? "" : " (no Cloudinary upload)"}…`);

		if (FRESH) await wipeDemoData();

		const hash = (plain: string) => bcryptjs.hash(plain, envVars.BCRYPT_SALT_ROUND);

		await seedSuperAdmin(hash);
		const divisionIds = await seedDivisions();
		const typeIds = await seedTourTypes();
		const tourIds = await seedTours(divisionIds, typeIds);
		await seedDivisionThumbnails(divisionIds);
		const userIds = await seedUsers(hash);

		const demoUserIds = [...userIds.values()];
		const hasActivity = await Booking.exists({ user: { $in: demoUserIds } });

		if (hasActivity) {
			console.log("Demo bookings already exist — skipping activity. Run with --fresh to rebuild it.");
		} else {
			await GuideApplication.deleteMany({ user: { $in: demoUserIds } });
			await seedGuideApplications(userIds, divisionIds);
			await seedBookings(userIds, tourIds);
		}

		console.log(`\nDone. Demo password for every *@${DEMO_EMAIL_DOMAIN} account: ${envVars.SEED_DEMO_PASSWORD ?? "Tourly@2026"}`);
	} catch (error) {
		console.error("Seed failed", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
};

run();
