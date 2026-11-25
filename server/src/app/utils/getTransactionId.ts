import crypto from "crypto";

export const getTransactionId = () => `tran_${crypto.randomBytes(12).toString("hex")}`;
