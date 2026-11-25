import { z } from "zod";
import { BOOKING_STATUS } from "./booking.interface";

export const createBookingZodSchema = z.object({
	tour: z.string({ error: "Tour id is required" }).regex(/^[a-f\d]{24}$/i, { error: "Invalid tour id" }),
	guestCount: z
		.number({ error: "Guest count is required" })
		.int({ error: "Guest count must be a whole number" })
		.positive({ error: "Guest count must be at least 1" }),
});

export const updateBookingStatusZodSchema = z.object({
	status: z.enum(BOOKING_STATUS),
});

export const myBookingsQuerySchema = z.object({
	status: z.enum(BOOKING_STATUS).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const allBookingsQuerySchema = myBookingsQuerySchema.extend({
	searchTerm: z.string().trim().max(100).optional(),
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
});

export const bookingSummaryQuerySchema = allBookingsQuerySchema.pick({ from: true, to: true });

export type TCreateBookingPayload = z.infer<typeof createBookingZodSchema>;
export type TMyBookingsQuery = z.infer<typeof myBookingsQuerySchema>;
export type TAllBookingsQuery = z.infer<typeof allBookingsQuerySchema>;
export type TBookingSummaryQuery = z.infer<typeof bookingSummaryQuerySchema>;
