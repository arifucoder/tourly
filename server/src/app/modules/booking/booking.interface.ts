import { Types } from "mongoose";

export enum BOOKING_STATUS {
	PENDING = "PENDING",
	CANCEL = "CANCEL",
	COMPLETE = "COMPLETE",
	FAILED = "FAILED",
}

export interface IBooking {
	bookingCode: string;
	user: Types.ObjectId;
	tour: Types.ObjectId;
	payment?: Types.ObjectId;
	guide?: Types.ObjectId | null;
	guideAssignedAt?: Date | null;
	expiredAt?: Date | null;
	guestCount: number;
	status: BOOKING_STATUS;
	createdAt?: Date;
	updatedAt?: Date;
}
