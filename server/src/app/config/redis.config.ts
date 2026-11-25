/* eslint-disable no-console */
import { createClient } from "redis";
import { envVars } from "./env";

const MAX_RETRIES = 5;

let hasConnected = false;
let lastErrorCode: string | undefined;

export const redisClient = createClient({
	username: envVars.REDIS_USERNAME,
	password: envVars.REDIS_PASSWORD,
	socket: {
		host: envVars.REDIS_HOST,
		port: envVars.REDIS_PORT,
		connectTimeout: 5_000,
		reconnectStrategy: (retries, cause) => {
			if (!hasConnected && retries >= MAX_RETRIES) {
				return new Error(`Could not connect to Redis at ${envVars.REDIS_HOST}:${envVars.REDIS_PORT} (${cause.message})`);
			}
			return Math.min(retries * 500, 5_000);
		},
	},
});

redisClient.on("error", (err: Error & { code?: string }) => {
	const code = err.code ?? err.message;
	if (code === lastErrorCode) return;
	lastErrorCode = code;
	console.error(`Redis error: ${err.message}`);
});

redisClient.on("ready", () => {
	hasConnected = true;
	lastErrorCode = undefined;
});

export const connectRedis = async () => {
	if (redisClient.isOpen) return;

	try {
		await redisClient.connect();
		console.log("Redis Connected");
	} catch (error) {
		throw new Error(
			`Redis is not reachable at ${envVars.REDIS_HOST}:${envVars.REDIS_PORT}. ` +
				"Start Redis locally (see .env.example) or fix REDIS_* in .env.",
			{ cause: error },
		);
	}
};
