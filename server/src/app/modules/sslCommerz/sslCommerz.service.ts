/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import type { ISSLCommerz, ISSLValidationResponse } from "./sslCommerz.interface";

const sslPaymentInit = async (payload: ISSLCommerz) => {
	try {
		const data = {
			store_id: envVars.SSL_STORE_ID,
			store_passwd: envVars.SSL_STORE_PASS,
			total_amount: payload.amount,
			currency: "BDT",
			tran_id: payload.transactionId,
			success_url: `${envVars.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
			fail_url: `${envVars.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
			cancel_url: `${envVars.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
			ipn_url: envVars.SSL_IPN_URL,
			shipping_method: "N/A",
			product_name: "Tour",
			product_category: "Service",
			product_profile: "general",
			cus_name: payload.name,
			cus_email: payload.email,
			cus_add1: payload.address,
			cus_add2: "N/A",
			cus_city: "Dhaka",
			cus_state: "Dhaka",
			cus_postcode: "1000",
			cus_country: "Bangladesh",
			cus_phone: payload.phoneNumber,
			cus_fax: "01711111111",
			ship_name: "N/A",
			ship_add1: "N/A",
			ship_add2: "N/A",
			ship_city: "N/A",
			ship_state: "N/A",
			ship_postcode: 1000,
			ship_country: "N/A",
		};

		const body = new URLSearchParams(
			Object.entries(data).map(([key, value]) => [key, String(value)]),
		);

		const response = await fetch(envVars.SSL_PAYMENT_API, {
			method: "POST",
			body,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			signal: AbortSignal.timeout(15_000),
		});
		const result = (await response.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };

		if (result.status !== "SUCCESS" || !result.GatewayPageURL) {
			throw new Error(result.failedreason || "Could not start payment.");
		}

		return result.GatewayPageURL;
	} catch (error: any) {
		console.error("SSLCommerz init failed", error);
		throw new AppError(httpStatus.BAD_REQUEST, error.message);
	}
};

const validatePayment = async (valId: string): Promise<ISSLValidationResponse> => {
	const url = new URL(envVars.SSL_VALIDATION_API);
	url.search = new URLSearchParams({
		val_id: valId,
		store_id: envVars.SSL_STORE_ID,
		store_passwd: envVars.SSL_STORE_PASS,
		format: "json",
	}).toString();

	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
		return (await response.json()) as ISSLValidationResponse;
	} catch {
		throw new AppError(httpStatus.BAD_GATEWAY, "Could not reach the payment gateway to verify this payment.");
	}
};

export const SSLService = {
	sslPaymentInit,
	validatePayment,
};
