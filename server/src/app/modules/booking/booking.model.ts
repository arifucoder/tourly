import { model, Schema } from "mongoose";
import { generateBookingCode } from "./booking.constant";
import { BOOKING_STATUS, type IBooking } from "./booking.interface";

const bookingSchema = new Schema<IBooking>(
	{
		bookingCode: {
			type: String,
			unique: true,
			sparse: true,
			default: () => generateBookingCode(),
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		tour: {
			type: Schema.Types.ObjectId,
			ref: "Tour",
			required: true,
		},
		payment: {
			type: Schema.Types.ObjectId,
			ref: "Payment",
		},
		guide: {
			type: Schema.Types.ObjectId,
			ref: "User",
			index: true,
			default: null,
		},
		guideAssignedAt: {
			type: Date,
			default: null,
		},
		expiredAt: {
			type: Date,
			default: null,
		},
		status: {
			type: String,
			enum: Object.values(BOOKING_STATUS),
			default: BOOKING_STATUS.PENDING,
			index: true,
		},
		guestCount: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, updatedAt: 1 });

export const Booking = model<IBooking>("Booking", bookingSchema);
