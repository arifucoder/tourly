/* eslint-disable no-console */
import { BookingService } from "../modules/booking/booking.service";

const INTERVAL_MS = 5 * 60 * 1000;

let timer: NodeJS.Timeout | undefined;

const run = async () => {
	try {
		const expired = await BookingService.expireStalePendingBookings();
		if (expired > 0) console.log(`Expired ${expired} unpaid booking(s)`);
	} catch (error) {
		console.error("Expiring unpaid bookings failed", error);
	}
};

export const startExpirePendingBookingsJob = () => {
	if (timer) return;
	void run();
	timer = setInterval(run, INTERVAL_MS);
	timer.unref();
};

export const stopExpirePendingBookingsJob = () => {
	if (timer) clearInterval(timer);
	timer = undefined;
};
