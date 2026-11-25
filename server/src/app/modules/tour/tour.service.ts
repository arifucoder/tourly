import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
	tourFilterableFields,
	tourSearchableFields,
	tourSelectableFields,
	tourSortableFields,
} from "./tour.constant";
import type { ITour, ITourType } from "./tour.interface";
import { Division } from "../division/division.model";
import { Tour, TourType } from "./tour.model";
import httpStatus from "http-status-codes";
import type { PipelineStage } from "mongoose";

const createTour = async (payload: ITour) => {
	const existingTour = await Tour.findOne({ title: payload.title });
	if (existingTour) {
		throw new Error("A tour with this title already exists.");
	}

	const tour = await Tour.create(payload);

	return tour;
};

const getAllTours = async (query: Record<string, string>) => {
	const queryBuilder = new QueryBuilder(
		Tour.find().populate("division", "name slug").populate("tourType", "name").lean(),
		query,
		{
			searchableFields: tourSearchableFields,
			filterableFields: tourFilterableFields,
			sortableFields: tourSortableFields,
			selectableFields: tourSelectableFields,
		},
	);

	const tours = queryBuilder.search().filter().sort().fields().paginate();

	const [data, meta] = await Promise.all([tours.build(), queryBuilder.getMeta()]);

	return { data, meta };
};

interface IFilterOption {
	_id: string;
	name: string;
	count: number;
}

const getTourFilterOptions = async () => {
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
		total: { count: number }[];
	}>([
		{
			$facet: {
				divisions: countBy("division", Division.collection.name),
				tourTypes: countBy("tourType", TourType.collection.name),
				total: [{ $count: "count" }],
			},
		},
	]);

	return {
		divisions: result?.divisions ?? [],
		tourTypes: result?.tourTypes ?? [],
		totalTours: result?.total[0]?.count ?? 0,
	};
};

const getSingleTour = async (slug: string) => {
	const tour = await Tour.findOne({ slug }).populate("division", "name slug").populate("tourType", "name");
	if (!tour) {
		throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
	}
	return tour;
};

const updateTour = async (id: string, payload: Partial<ITour>) => {
	const existingTour = await Tour.findById(id);

	if (!existingTour) {
		throw new Error("Tour not found.");
	}

	if (payload.images && payload.images.length > 0 && existingTour.images && existingTour.images.length > 0) {
		payload.images = [...payload.images, ...existingTour.images];
	}

	if (
		payload.deleteImages &&
		payload.deleteImages.length > 0 &&
		existingTour.images &&
		existingTour.images.length > 0
	) {
		const restDBImages = existingTour.images.filter((imageUrl) => !payload.deleteImages?.includes(imageUrl));

		const updatedPayloadImages = (payload.images || [])
			.filter((imageUrl) => !payload.deleteImages?.includes(imageUrl))
			.filter((imageUrl) => !restDBImages.includes(imageUrl));

		payload.images = [...restDBImages, ...updatedPayloadImages];
	}

	const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

	if (
		payload.deleteImages &&
		payload.deleteImages.length > 0 &&
		existingTour.images &&
		existingTour.images.length > 0
	) {
		await Promise.all(payload.deleteImages.map((url) => deleteImageFromCLoudinary(url)));
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

const createTourType = async (payload: ITourType) => {
	const existingTourType = await TourType.findOne({ name: payload.name });

	if (existingTourType) {
		throw new Error("Tour type already exists.");
	}

	return await TourType.create({ name: payload.name });
};
const getAllTourTypes = async () => {
	return await TourType.find();
};
const updateTourType = async (id: string, payload: ITourType) => {
	const existingTourType = await TourType.findById(id);
	if (!existingTourType) {
		throw new Error("Tour type not found.");
	}

	const updatedTourType = await TourType.findByIdAndUpdate(id, payload, { new: true });
	return updatedTourType;
};
const deleteTourType = async (id: string) => {
	const existingTourType = await TourType.findById(id);
	if (!existingTourType) {
		throw new Error("Tour type not found.");
	}

	return await TourType.findByIdAndDelete(id);
};

export const TourService = {
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
