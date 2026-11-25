import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
	isTourExpired,
	toTourStatus,
	tourFilterableFields,
	tourMultiValueFields,
	tourSearchableFields,
	tourSelectableFields,
	tourSortableFields,
	tourStatusFilter,
} from "./tour.constant";
import type { ITour, ITourType } from "./tour.interface";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { countBookedSeats, countBookedSeatsByTour } from "../booking/booking.service";
import { Division } from "../division/division.model";
import { Tour, TourType } from "./tour.model";
import httpStatus from "http-status-codes";
import type { PipelineStage, Types } from "mongoose";

const createTour = async (payload: ITour) => {
	const existingTour = await Tour.findOne({ title: payload.title });
	if (existingTour) {
		throw new Error("A tour with this title already exists.");
	}

	const tour = await Tour.create(payload);

	return tour;
};

const toPrice = (value?: string) => {
	if (!value) return undefined;
	const price = Number(value);
	return Number.isFinite(price) && price >= 0 ? price : undefined;
};

const getAllTours = async (query: Record<string, string>) => {
	const minPrice = toPrice(query.minPrice);
	const maxPrice = toPrice(query.maxPrice);
	const costFrom = {
		...(minPrice !== undefined && { $gte: minPrice }),
		...(maxPrice !== undefined && { $lte: maxPrice }),
	};

	const queryBuilder = new QueryBuilder(
		Tour.find({
			...tourStatusFilter(toTourStatus(query.status)),
			...(Object.keys(costFrom).length > 0 && { costFrom }),
		})
			.populate("division", "name slug")
			.populate("tourType", "name")
			.lean(),
		query,
		{
			searchableFields: tourSearchableFields,
			filterableFields: tourFilterableFields,
			multiValueFields: tourMultiValueFields,
			sortableFields: tourSortableFields,
			selectableFields: tourSelectableFields,
		},
	);

	const tours = queryBuilder.search().filter().sort().fields().paginate();

	const [tourList, meta] = await Promise.all([tours.build(), queryBuilder.getMeta()]);
	const tourIds = tourList.map((tour) => tour._id);
	const [bookedSeats, bookingCounts] = await Promise.all([
		countBookedSeatsByTour(tourIds),
		Booking.aggregate<{ _id: Types.ObjectId; count: number }>([
			{ $match: { tour: { $in: tourIds }, status: BOOKING_STATUS.COMPLETE } },
			{ $group: { _id: "$tour", count: { $sum: 1 } } },
		]),
	]);
	const bookingsByTour = new Map(bookingCounts.map((row) => [String(row._id), row.count]));

	const data = tourList.map((tour) => ({
		...tour,
		seatsLeft: tour.maxGuest ? Math.max(tour.maxGuest - (bookedSeats.get(String(tour._id)) ?? 0), 0) : null,
		bookingsCount: bookingsByTour.get(String(tour._id)) ?? 0,
		isExpired: isTourExpired(tour.startDate),
	}));

	return { data, meta };
};

interface IFilterOption {
	_id: string;
	name: string;
	count: number;
}

const getTourFilterOptions = async (status?: string) => {
	const countBy = (field: "division" | "tourType", from: string): PipelineStage.FacetPipelineStage[] => [
		{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
		{ $lookup: { from, localField: "_id", foreignField: "_id", as: "ref", pipeline: [{ $project: { name: 1 } }] } },
		{ $unwind: "$ref" },
		{ $project: { _id: 1, count: 1, name: "$ref.name" } },
		{ $sort: { name: 1 } },
	];

	const [result] = await Tour.aggregate<{
		divisions: IFilterOption[];
		tourTypes: IFilterOption[];
		locations: { name: string; count: number }[];
		price: { min: number; max: number }[];
		total: { count: number }[];
	}>([
		{ $match: tourStatusFilter(toTourStatus(status)) },
		{
			$facet: {
				divisions: countBy("division", Division.collection.name),
				tourTypes: countBy("tourType", TourType.collection.name),
				locations: [
					{ $match: { location: { $nin: [null, ""] } } },
					{ $group: { _id: "$location", count: { $sum: 1 } } },
					{ $sort: { _id: 1 } },
					{ $project: { _id: 0, name: "$_id", count: 1 } },
				],
				price: [{ $group: { _id: null, min: { $min: "$costFrom" }, max: { $max: "$costFrom" } } }],
				total: [{ $count: "count" }],
			},
		},
	]);

	return {
		divisions: result?.divisions ?? [],
		tourTypes: result?.tourTypes ?? [],
		locations: result?.locations ?? [],
		priceRange: { min: result?.price[0]?.min ?? 0, max: result?.price[0]?.max ?? 0 },
		totalTours: result?.total[0]?.count ?? 0,
	};
};

const TRENDING_WINDOW_DAYS = 90;
const TOUR_CARD_FIELDS = "title slug images location costFrom startDate endDate maxGuest division tourType";

const getTrendingTours = async (limit: number) => {
	const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

	const ranked = await Booking.aggregate<{ _id: Types.ObjectId; bookings: number }>([
		{ $match: { status: BOOKING_STATUS.COMPLETE, createdAt: { $gte: since } } },
		{ $lookup: { from: Tour.collection.name, localField: "tour", foreignField: "_id", as: "t", pipeline: [{ $project: { startDate: 1 } }] } },
		{ $match: { "t.0": { $exists: true }, "t.startDate": { $not: { $lt: new Date() } } } },
		{ $group: { _id: "$tour", bookings: { $sum: 1 } } },
		{ $sort: { bookings: -1 } },
		{ $limit: limit },
	]);

	const bookingsByTour = new Map(ranked.map((row) => [row._id.toString(), row.bookings]));
	const rankedTours = await Tour.find({ _id: { $in: ranked.map((row) => row._id) } })
		.select(TOUR_CARD_FIELDS)
		.populate("division", "name slug")
		.populate("tourType", "name")
		.lean();

	const tours = rankedTours
		.map((tour) => ({ ...tour, bookingsCount: bookingsByTour.get(tour._id.toString()) ?? 0 }))
		.sort((a, b) => b.bookingsCount - a.bookingsCount);

	if (tours.length < limit) {
		const fillers = await Tour.find({ _id: { $nin: tours.map((tour) => tour._id) }, ...tourStatusFilter("active") })
			.sort("startDate")
			.limit(limit - tours.length)
			.select(TOUR_CARD_FIELDS)
			.populate("division", "name slug")
			.populate("tourType", "name")
			.lean();
		tours.push(...fillers.map((tour) => ({ ...tour, bookingsCount: 0 })));
	}

	return tours;
};

const getSingleTour = async (slug: string) => {
	const tour = await Tour.findOne({ slug }).populate("division", "name slug").populate("tourType", "name").lean();
	if (!tour) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
	}
	const seatsBooked = await countBookedSeats(tour._id);
	return {
		...tour,
		seatsBooked,
		seatsLeft: tour.maxGuest ? Math.max(tour.maxGuest - seatsBooked, 0) : null,
		isExpired: isTourExpired(tour.startDate),
	};
};

const updateTour = async (id: string, payload: Partial<ITour>) => {
	const existingTour = await Tour.findById(id);

	if (!existingTour) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
	}

	const { deleteImages = [], images: newImages = [], ...rest } = payload;
	const currentImages = existingTour.images ?? [];
	const removed = currentImages.filter((url) => deleteImages.includes(url));
	const images = [...currentImages.filter((url) => !deleteImages.includes(url)), ...newImages];

	const updatedTour = await Tour.findByIdAndUpdate(id, { ...rest, images }, { new: true, runValidators: true });

	if (removed.length > 0) {
		await Promise.all(removed.map((url) => deleteImageFromCLoudinary(url)));
	}

	return updatedTour;
};

const deleteTour = async (id: string) => {
	const tour = await Tour.findByIdAndDelete(id);
	if (!tour) {
		throw new AppError(404, "Tour not found.");
	}

	if (tour.images?.length) {
		await Promise.all(tour.images.map((url) => deleteImageFromCLoudinary(url)));
	}

	return null;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertUniqueTourTypeName = async (name: string, excludeId?: string) => {
	const duplicate = await TourType.exists({
		name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
		...(excludeId && { _id: { $ne: excludeId } }),
	});
	if (duplicate) {
		throw new AppError(httpStatus.CONFLICT, `"${name.trim()}" already exists.`);
	}
};

const createTourType = async (payload: ITourType) => {
	await assertUniqueTourTypeName(payload.name);
	return await TourType.create({ name: payload.name.trim() });
};

const getAllTourTypes = async () => {
	const [types, counts] = await Promise.all([
		TourType.find().sort("-createdAt").lean(),
		Tour.aggregate<{ _id: Types.ObjectId; count: number }>([{ $group: { _id: "$tourType", count: { $sum: 1 } } }]),
	]);
	const countByType = new Map(counts.map((row) => [String(row._id), row.count]));
	return types.map((type) => ({ ...type, tourCount: countByType.get(String(type._id)) ?? 0 }));
};

const updateTourType = async (id: string, payload: ITourType) => {
	const existingTourType = await TourType.findById(id);
	if (!existingTourType) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour type not found.");
	}

	await assertUniqueTourTypeName(payload.name, id);
	return await TourType.findByIdAndUpdate(id, { name: payload.name.trim() }, { new: true });
};

const deleteTourType = async (id: string) => {
	const existingTourType = await TourType.findById(id);
	if (!existingTourType) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour type not found.");
	}

	const inUse = await Tour.countDocuments({ tourType: id });
	if (inUse > 0) {
		throw new AppError(httpStatus.CONFLICT, `In use by ${inUse} tour${inUse === 1 ? "" : "s"}. Reassign them first.`);
	}

	return await TourType.findByIdAndDelete(id);
};

export const TourService = {
	getTrendingTours,
	getTourFilterOptions,
	createTour,
	createTourType,
	deleteTourType,
	updateTourType,
	getAllTourTypes,
	getAllTours,
	updateTour,
	deleteTour,
	getSingleTour,
};
