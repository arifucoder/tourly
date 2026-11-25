import type { Request, Response } from "express";
import httpStatus from "http-status-codes";
import type { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import {
	allBookingsQuerySchema,
	assignedBookingsQuerySchema,
	bookingSummaryQuerySchema,
	myBookingsQuerySchema,
} from "./booking.validation";

const createBooking = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.createBooking(req.body, (req.user as JwtPayload).userId);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Booking created successfully",
		data: result,
	});
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
	const query = myBookingsQuerySchema.parse(req.query);
	const result = await BookingService.getUserBookings((req.user as JwtPayload).userId, query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Bookings retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getUserBookingSummary = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.getUserBookingSummary((req.user as JwtPayload).userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking summary retrieved successfully",
		data: result,
	});
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.getBookingById(req.params.bookingId as string, {
		userId: (req.user as JwtPayload).userId,
		role: (req.user as JwtPayload).role,
	});
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking retrieved successfully",
		data: result,
	});
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
	const query = allBookingsQuerySchema.parse(req.query);
	const result = await BookingService.getAllBookings(query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Bookings retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getBookingSummary = catchAsync(async (req: Request, res: Response) => {
	const query = bookingSummaryQuerySchema.parse(req.query);
	const result = await BookingService.getBookingSummary(query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking summary retrieved successfully",
		data: result,
	});
});

const cancelMyBooking = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.cancelMyBooking(req.params.bookingId as string, (req.user as JwtPayload).userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking cancelled successfully",
		data: result,
	});
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.updateBookingStatus(req.params.bookingId as string, req.body.status);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking status updated successfully",
		data: result,
	});
});

const getAvailableGuides = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.getAvailableGuides(req.params.bookingId as string);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Available guides retrieved successfully",
		data: result,
	});
});

const assignGuide = catchAsync(async (req: Request, res: Response) => {
	const result = await BookingService.assignGuide(req.params.bookingId as string, req.body.guide);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: req.body.guide ? "Guide assigned successfully" : "Guide removed from booking",
		data: result,
	});
});

const getAssignedBookings = catchAsync(async (req: Request, res: Response) => {
	const query = assignedBookingsQuerySchema.parse(req.query);
	const result = await BookingService.getAssignedBookings((req.user as JwtPayload).userId, query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assigned bookings retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const BookingController = {
	getAvailableGuides,
	assignGuide,
	getAssignedBookings,
	createBooking,
	getUserBookings,
	getUserBookingSummary,
	getSingleBooking,
	getAllBookings,
	getBookingSummary,
	cancelMyBooking,
	updateBookingStatus,
};
