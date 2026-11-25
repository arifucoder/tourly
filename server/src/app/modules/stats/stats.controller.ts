import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { z } from "zod";
import { getDashboardStats, getPublicStats } from "./dashboard.service";
import { StatsService } from "./stats.service";

const dashboardQuerySchema = z.object({
	days: z.coerce
		.number()
		.refine((value): value is 7 | 14 | 30 => [7, 14, 30].includes(value), { error: "days must be 7, 14 or 30" })
		.default(14),
});

const getDashboard = catchAsync(async (req: Request, res: Response) => {
	const { days } = dashboardQuerySchema.parse(req.query);
	const stats = await getDashboardStats(days as 7 | 14 | 30);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Dashboard stats fetched successfully",
		data: stats,
	});
});

const getPublic = catchAsync(async (req: Request, res: Response) => {
	const stats = await getPublicStats();
	res.set("Cache-Control", "public, max-age=300");
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Public stats fetched successfully",
		data: stats,
	});
});

const getBookingStats = catchAsync(async (req: Request, res: Response) => {
	const stats = await StatsService.getBookingStats();
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Booking stats fetched successfully",
		data: stats,
	});
});

const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
	const stats = await StatsService.getPaymentStats();
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Payment stats fetched successfully",
		data: stats,
	});
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
	const stats = await StatsService.getUserStats();
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User stats fetched successfully",
		data: stats,
	});
});

const getTourStats = catchAsync(async (req: Request, res: Response) => {
	const stats = await StatsService.getTourStats();
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Tour stats fetched successfully",
		data: stats,
	});
});

export const StatsController = {
	getDashboard,
	getPublic,
	getBookingStats,
	getPaymentStats,
	getUserStats,
	getTourStats,
};
