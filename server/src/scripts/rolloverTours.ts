/* eslint-disable no-console */
import mongoose from "mongoose";
import { envVars } from "../app/config/env";
import { TourService } from "../app/modules/tour/tour.service";

const run = async () => {
	try {
		await mongoose.connect(envVars.DB_URL);
		const moved = await TourService.rolloverExpiredTours({
			leadDays: envVars.TOUR_ROLLOVER_LEAD_DAYS,
			spreadDays: envVars.TOUR_ROLLOVER_SPREAD_DAYS,
		});
		console.log(moved > 0 ? `Rolled ${moved} expired demo tour(s) to new dates` : "No expired demo tours");
	} catch (error) {
		console.error("Tour rollover failed", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
};

run();
