import httpStatus from "http-status-codes";
import type { Types } from "mongoose";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { Tour } from "../tour/tour.model";
import type { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (payload: IDivision) => {
	const existingDivision = await Division.findOne({ name: payload.name });
	if (existingDivision) {
		throw new Error("A division with this name already exists.");
	}
	const division = await Division.create(payload);

	return division;
};

const getAllDivisions = async () => {
	const [rows, counts] = await Promise.all([
		Division.find({}).sort("-createdAt").lean(),
		Tour.aggregate<{ _id: Types.ObjectId; count: number }>([{ $group: { _id: "$division", count: { $sum: 1 } } }]),
	]);
	const countByDivision = new Map(counts.map((row) => [String(row._id), row.count]));
	const divisions = rows.map((row) => ({ ...row, tourCount: countByDivision.get(String(row._id)) ?? 0 }));
	return {
		data: divisions,
		meta: { page: 1, limit: divisions.length, total: divisions.length, totalPage: 1 },
	};
};
const getSingleDivision = async (slug: string) => {
	const division = await Division.findOne({ slug });
	return {
		data: division,
	};
};

const updateDivision = async (id: string, payload: Partial<IDivision>) => {
	const existingDivision = await Division.findById(id);
	if (!existingDivision) {
		throw new Error("Division not found.");
	}

	const duplicateDivision = await Division.findOne({
		name: payload.name,
		_id: { $ne: id },
	});

	if (duplicateDivision) {
		throw new Error("A division with this name already exists.");
	}

	const updatedDivision = await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

	if (payload.thumbnail && existingDivision.thumbnail) {
		await deleteImageFromCLoudinary(existingDivision.thumbnail);
	}

	return updatedDivision;
};

const deleteDivision = async (id: string) => {
	const division = await Division.findById(id);
	if (!division) {
		throw new Error("Division not found.");
	}

	const inUse = await Tour.countDocuments({ division: id });
	if (inUse > 0) {
		throw new AppError(httpStatus.CONFLICT, `In use by ${inUse} tour${inUse === 1 ? "" : "s"}. Move them first.`);
	}

	await Division.findByIdAndDelete(id);

	if (division.thumbnail) {
		await deleteImageFromCLoudinary(division.thumbnail);
	}

	return null;
};

export const DivisionService = {
	createDivision,
	getAllDivisions,
	getSingleDivision,
	updateDivision,
	deleteDivision,
};
