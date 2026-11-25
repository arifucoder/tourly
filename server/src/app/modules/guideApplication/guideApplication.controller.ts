import type { Request, Response } from "express";
import httpStatus from "http-status-codes";
import type { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GuideApplicationService } from "./guideApplication.service";
import { guideApplicationListQuerySchema } from "./guideApplication.validation";

const currentUserId = (req: Request) => (req.user as JwtPayload).userId as string;

const applyAsGuide = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.applyAsGuide(currentUserId(req), req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Application submitted. We'll review it soon.",
		data: result,
	});
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.getMyApplications(currentUserId(req));
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Applications retrieved successfully",
		data: result,
	});
});

const withdrawMyApplication = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.withdrawMyApplication(currentUserId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application withdrawn",
		data: result,
	});
});

const getAllApplications = catchAsync(async (req: Request, res: Response) => {
	const query = guideApplicationListQuerySchema.parse(req.query);
	const result = await GuideApplicationService.getAllApplications(query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Applications retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getApplicationSummary = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.getApplicationSummary();
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application summary retrieved successfully",
		data: result,
	});
});

const getApplicationById = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.getApplicationById(req.params.id as string);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application retrieved successfully",
		data: result,
	});
});

const reviewApplication = catchAsync(async (req: Request, res: Response) => {
	const result = await GuideApplicationService.reviewApplication(req.params.id as string, currentUserId(req), req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Application ${result.status.toLowerCase()}`,
		data: result,
	});
});

export const GuideApplicationController = {
	applyAsGuide,
	getMyApplications,
	withdrawMyApplication,
	getAllApplications,
	getApplicationSummary,
	getApplicationById,
	reviewApplication,
};
