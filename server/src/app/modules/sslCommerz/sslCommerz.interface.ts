export interface ISSLCommerz {
	amount: number;
	transactionId: string;
	name: string;
	email: string;
	phoneNumber: string;
	address: string;
}

export interface ISSLValidationResponse {
	status?: "VALID" | "VALIDATED" | "INVALID_TRANSACTION" | string;
	tran_id?: string;
	val_id?: string;
	amount?: string;
	currency?: string;
	[key: string]: unknown;
}
