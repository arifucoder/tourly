import type { Request, Response } from "express";
import mongoose from "mongoose";
import { redisClient } from "../config/redis.config";

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
	Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

const check = async (probe: () => Promise<unknown>) => {
	try {
		await withTimeout(probe(), 2_000);
		return "up" as const;
	} catch {
		return "down" as const;
	}
};

export const healthCheck = async (req: Request, res: Response) => {
	const [db, redis] = await Promise.all([
		check(async () => {
			if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error("not connected");
			await mongoose.connection.db.admin().ping();
		}),
		check(() => redisClient.ping()),
	]);

	const healthy = db === "up" && redis === "up";

	res.set("Cache-Control", "no-store");
	res.status(healthy ? 200 : 503).json({
		status: healthy ? "ok" : "degraded",
		db,
		redis,
		uptime: Math.round(process.uptime()),
		timestamp: new Date().toISOString(),
	});
};
