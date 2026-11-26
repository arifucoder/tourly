/* eslint-disable no-console */
import { envVars } from "../config/env";
import { TourService } from "../modules/tour/tour.service";

let timer: NodeJS.Timeout | undefined;

const run = async () => {
	try {
		const moved = await TourService.rolloverExpiredTours({
			leadDays: envVars.TOUR_ROLLOVER_LEAD_DAYS,
			spreadDays: envVars.TOUR_ROLLOVER_SPREAD_DAYS,
		});
		if (moved > 0) console.log(`Rolled ${moved} expired demo tour(s) to new dates`);
	} catch (error) {
		console.error("Rolling over tour dates failed", error);
	}
};

export const startRolloverTourDatesJob = () => {
	if (timer || !envVars.TOUR_ROLLOVER_ENABLED) return;
	void run();
	timer = setInterval(run, envVars.TOUR_ROLLOVER_CHECK_HOURS * 60 * 60 * 1000);
	timer.unref();
};

export const stopRolloverTourDatesJob = () => {
	if (timer) clearInterval(timer);
	timer = undefined;
};
