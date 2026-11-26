/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextFunction, type Request, type Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

import { deleteImageFromCLoudinary } from "../config/cloudinary.config";
import { handleCastError } from "../errorHelpers/handleCastError";
import { handlerDuplicateError } from "../errorHelpers/handleDuplicateError";
import { handlerValidationError } from "../errorHelpers/handlerValidationError";
import { handlerZodError } from "../errorHelpers/handlerZodError";
import type { TErrorSources } from "../interfaces/error.types";

export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
	if (envVars.NODE_ENV === "development") {
		console.error(err);
	}

	if (req.file?.path) {
		await deleteImageFromCLoudinary(req.file.path).catch(() => undefined);
	}

	if (req.files && Array.isArray(req.files) && req.files.length) {
		const imageUrls = (req.files as Express.Multer.File[]).map((file) => file.path);

		await Promise.all(imageUrls.map((url) => deleteImageFromCLoudinary(url)));
	}

	let errorSources: TErrorSources[] = [];
	let statusCode = 500;
	let message = "Something Went Wrong!!";

	if (err.code === 11000) {
		const simplifiedError = handlerDuplicateError(err);
		statusCode = simplifiedError.statusCode;
		message = simplifiedError.message;
	}
	else if (err.name === "CastError") {
		const simplifiedError = handleCastError(err);
		statusCode = simplifiedError.statusCode;
		message = simplifiedError.message;
	} else if (err.name === "ZodError") {
		const simplifiedError = handlerZodError(err);
		statusCode = simplifiedError.statusCode;
		message = simplifiedError.message;
		errorSources = simplifiedError.errorSources as TErrorSources[];
	}
	else if (err.name === "ValidationError") {
		const simplifiedError = handlerValidationError(err);
		statusCode = simplifiedError.statusCode;
		errorSources = simplifiedError.errorSources as TErrorSources[];
		message = simplifiedError.message;
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
	} else if (err?.name === "MulterError") {
		statusCode = 400;
		message = err.code === "LIMIT_FILE_SIZE" ? "File is too large." : err.message;
	} else if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
		statusCode = err.status;
		message = err.expose ? err.message : "Bad request";
	} else if (err instanceof Error) {
		statusCode = 500;
		message = envVars.NODE_ENV === "development" ? err.message : "Something went wrong. Please try again.";
	}

	res.status(statusCode).json({
		success: false,
		message,
		errorSources,
		err: envVars.NODE_ENV === "development" ? err : null,
		stack: envVars.NODE_ENV === "development" ? err.stack : null,
	});
};
