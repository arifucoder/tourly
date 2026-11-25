import { z } from "zod";

const E164 = /^\+[1-9]\d{7,14}$/;

// "+1 (144) 581-6964" → "+11445816964", "0044 20 7946 0958" → "+442079460958",
// local Bangladeshi "01712345678" → "+8801712345678"
export const normalizePhone = (value: string) => {
	let phone = value.trim().replace(/[\s().-]/g, "");
	if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
	if (/^01\d{9}$/.test(phone)) phone = `+880${phone.slice(1)}`;
	return phone;
};

export const phoneSchema = z
	.string({ error: "Phone number must be a string" })
	.transform(normalizePhone)
	.pipe(
		z.string().regex(E164, {
			error: "Enter a valid phone number with country code, e.g. +1 415 555 0132 or +880 1712 345678",
		}),
	);
