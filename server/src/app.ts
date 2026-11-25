import cookieParser from "cookie-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { apiLimiter, authLimiter } from "./app/middlewares/rateLimiter";
import { router } from "./app/routes";

const app = express();

app.set("trust proxy", envVars.TRUST_PROXY_HOPS);

app.use(helmet());
app.use(
	cors({
		origin: envVars.FRONTEND_URL,
		credentials: true,
	}),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/v1", apiLimiter);
app.use(["/api/v1/auth/login", "/api/v1/auth/forgot-password", "/api/v1/otp", "/api/v1/user/register"], authLimiter);
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		message: "Welcome to Tour Management System Backend",
	});
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
