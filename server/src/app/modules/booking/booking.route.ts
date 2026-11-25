import express from "express";

import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { BookingController } from "./booking.controller";
import { assignGuideZodSchema, createBookingZodSchema, updateBookingStatusZodSchema } from "./booking.validation";

const router = express.Router();

const allRoles = Object.values(Role);
const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];

router.post("/", checkAuth(...allRoles), validateRequest(createBookingZodSchema), BookingController.createBooking);

router.get("/", checkAuth(...adminRoles), BookingController.getAllBookings);
router.get("/summary", checkAuth(...adminRoles), BookingController.getBookingSummary);
router.get("/export", checkAuth(...adminRoles), BookingController.exportBookingsCsv);

router.get("/my-bookings", checkAuth(...allRoles), BookingController.getUserBookings);
router.get("/my-bookings/summary", checkAuth(...allRoles), BookingController.getUserBookingSummary);

router.get("/assigned", checkAuth(Role.GUIDE), BookingController.getAssignedBookings);

router.get("/:bookingId", checkAuth(...allRoles), BookingController.getSingleBooking);
router.get("/:bookingId/available-guides", checkAuth(...adminRoles), BookingController.getAvailableGuides);
router.patch(
	"/:bookingId/assign-guide",
	checkAuth(...adminRoles),
	validateRequest(assignGuideZodSchema),
	BookingController.assignGuide,
);

router.patch("/:bookingId/cancel", checkAuth(...allRoles), BookingController.cancelMyBooking);
router.patch(
	"/:bookingId/status",
	checkAuth(...adminRoles),
	validateRequest(updateBookingStatusZodSchema),
	BookingController.updateBookingStatus,
);

export const BookingRoutes = router;
