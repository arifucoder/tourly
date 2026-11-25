const E164 = /^\+[1-9]\d{7,14}$/;

// Same rules as the API: any country with "+<country code>", local BD numbers (01XXXXXXXXX) are allowed too.
export const normalizePhone = (value: string) => {
	let phone = value.trim().replace(/[\s().-]/g, "");
	if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
	if (/^01\d{9}$/.test(phone)) phone = `+880${phone.slice(1)}`;
	return phone;
};

export const isValidPhone = (value: string) => E164.test(normalizePhone(value));

export const PHONE_ERROR = "Enter a valid phone number with country code, e.g. +1 415 555 0132";
