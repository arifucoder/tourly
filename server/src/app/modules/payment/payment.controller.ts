import { type Request, type Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const initPayment = catchAsync(async (req: Request, res: Response) => {
	const bookingId = req.params.bookingId;
	const result = await PaymentService.initPayment(bookingId as string, (req.user as JwtPayload).userId);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Payment session created",
		data: result,
	});
});
const readGatewayField = (req: Request, bodyKey: string, queryKey: string) => {
	const fromBody = (req.body as Record<string, unknown> | undefined)?.[bodyKey];
	const fromQuery = req.query[queryKey];
	const value = typeof fromBody === "string" ? fromBody : fromQuery;
	return typeof value === "string" ? value : undefined;
};

const redirectTo = (res: Response, baseUrl: string, params: Record<string, string | number | undefined>) => {
	const url = new URL(baseUrl);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) url.searchParams.set(key, String(value));
	}
	res.redirect(url.toString());
};

const successPayment = async (req: Request, res: Response) => {
	const transactionId = readGatewayField(req, "tran_id", "transactionId");
	const valId = readGatewayField(req, "val_id", "val_id");

	try {
		const result = await PaymentService.confirmPayment({ transactionId, valId });
		redirectTo(res, envVars.SSL_SUCCESS_FRONTEND_URL, {
			transactionId: result.transactionId,
			amount: result.amount,
			status: "success",
			message: "Payment completed successfully",
		});
	} catch (error) {
		redirectTo(res, envVars.SSL_FAIL_FRONTEND_URL, {
			transactionId,
			status: "fail",
			message: error instanceof AppError ? error.message : "Payment could not be verified",
		});
	}
};

const failPayment = catchAsync(async (req: Request, res: Response) => {
	const transactionId = readGatewayField(req, "tran_id", "transactionId");
	await PaymentService.failPayment(transactionId);
	redirectTo(res, envVars.SSL_FAIL_FRONTEND_URL, { transactionId, status: "fail", message: "Payment failed" });
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
	const transactionId = readGatewayField(req, "tran_id", "transactionId");
	await PaymentService.cancelPayment(transactionId);
	redirectTo(res, envVars.SSL_CANCEL_FRONTEND_URL, { transactionId, status: "cancel", message: "Payment cancelled" });
});

const getInvoiceDownloadUrl = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as JwtPayload;
	const result = await PaymentService.getInvoiceDownloadUrl(req.params.paymentId as string, {
		userId: user.userId,
		role: user.role,
	});
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Invoice download URL retrieved successfully",
		data: result,
	});
});

const paymentIpn = catchAsync(async (req: Request, res: Response) => {
	const result = await PaymentService.confirmPayment({
		transactionId: readGatewayField(req, "tran_id", "tran_id"),
		valId: readGatewayField(req, "val_id", "val_id"),
	});
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: result.alreadyPaid ? "Payment already confirmed" : "Payment confirmed",
		data: null,
	});
});

export const PaymentController = {
	initPayment,
	successPayment,
	failPayment,
	cancelPayment,
	getInvoiceDownloadUrl,
	paymentIpn,
};
