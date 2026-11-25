import crypto from "crypto";
import { BOOKING_STATUS } from "./booking.interface";

export const PAYMENT_HOLD_MINUTES = 30;

export const paymentHoldCutoff = () => new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60 * 1000);

export const ADMIN_STATUS_TRANSITIONS: Record<BOOKING_STATUS, BOOKING_STATUS[]> = {
	[BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CANCEL],
	[BOOKING_STATUS.COMPLETE]: [BOOKING_STATUS.CANCEL],
	[BOOKING_STATUS.FAILED]: [BOOKING_STATUS.CANCEL],
	[BOOKING_STATUS.CANCEL]: [],
};

export const generateBookingCode = (date = new Date()) => {
	const yy = String(date.getFullYear()).slice(-2);
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const suffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
	return `TL-${yy}${mm}-${suffix}`;
};
