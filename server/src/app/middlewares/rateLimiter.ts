import rateLimit from "express-rate-limit";

const message = { success: false, message: "Too many requests. Please try again later." };

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message,
});

export const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 300,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message,
});
