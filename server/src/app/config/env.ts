import dotenv from "dotenv";
import * as z from "zod";

dotenv.config();

const DURATION_REGEX = /^\d+(?:\.\d+)?\s?(?:ms|s|m|h|d|w|y)$/i;

const secret = z.string().min(32, "Must be at least 32 characters (generate: openssl rand -base64 32)");
const duration = z.string().regex(DURATION_REGEX, 'Must be a duration like "15m", "1d" or "30d"');
const httpUrl = z.url({ protocol: /^https?$/ });
const port = z.coerce.number().int().min(1).max(65535);
const required = z.string().trim().min(1);

const envSchema = z
	.object({
		NODE_ENV: z.enum(["development", "production"]).default("development"),
		PORT: port.default(5000),
		TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
		FRONTEND_URL: httpUrl,

		DB_URL: z.url({ protocol: /^mongodb(\+srv)?$/ }),

		JWT_ACCESS_SECRET: secret,
		JWT_ACCESS_EXPIRES: duration,
		JWT_REFRESH_SECRET: secret,
		JWT_REFRESH_EXPIRES: duration,
		BCRYPT_SALT_ROUND: z.coerce.number().int().min(8).max(14).default(10),

		SUPER_ADMIN_EMAIL: z.email().optional(),
		SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),

		GOOGLE_CLIENT_ID: z.string().trim().endsWith(".apps.googleusercontent.com", 'Must end with ".apps.googleusercontent.com"'),
		GOOGLE_CLIENT_SECRET: required,
		GOOGLE_CALLBACK_URL: httpUrl,

		SSL_STORE_ID: required,
		SSL_STORE_PASS: required,
		SSL_PAYMENT_API: z.url({ protocol: /^https$/ }),
		SSL_VALIDATION_API: z.url({ protocol: /^https$/ }),
		SSL_IPN_URL: httpUrl,
		SSL_SUCCESS_BACKEND_URL: httpUrl,
		SSL_FAIL_BACKEND_URL: httpUrl,
		SSL_CANCEL_BACKEND_URL: httpUrl,
		SSL_SUCCESS_FRONTEND_URL: httpUrl,
		SSL_FAIL_FRONTEND_URL: httpUrl,
		SSL_CANCEL_FRONTEND_URL: httpUrl,

		CLOUDINARY_CLOUD_NAME: required,
		CLOUDINARY_API_KEY: required,
		CLOUDINARY_API_SECRET: required,

		SMTP_HOST: required,
		SMTP_PORT: port,
		SMTP_USER: required,
		SMTP_PASS: required,
		SMTP_FROM: z.email(),

		REDIS_HOST: required,
		REDIS_PORT: port.default(6379),
		REDIS_USERNAME: required.optional(),
		REDIS_PASSWORD: required.optional(),

		TOUR_ROLLOVER_ENABLED: z.stringbool().default(true),
		TOUR_ROLLOVER_CHECK_HOURS: z.coerce.number().min(1).max(168).default(6),
		TOUR_ROLLOVER_LEAD_DAYS: z.coerce.number().int().min(1).max(30).default(3),
		TOUR_ROLLOVER_SPREAD_DAYS: z.coerce.number().int().min(0).max(90).default(21),

		SEED_DEMO_PASSWORD: z.string().min(8).optional(),
	})
	.superRefine((env, ctx) => {
		if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
			ctx.addIssue({
				code: "custom",
				path: ["JWT_REFRESH_SECRET"],
				message: "Must be different from JWT_ACCESS_SECRET",
			});
		}
		if (env.NODE_ENV === "production") {
			const mustBeHttps = ["FRONTEND_URL", "GOOGLE_CALLBACK_URL", "SSL_IPN_URL"] as const;
			for (const key of mustBeHttps) {
				if (!env[key].startsWith("https://")) {
					ctx.addIssue({ code: "custom", path: [key], message: "Must use https in production" });
				}
			}
			if (!env.REDIS_PASSWORD) {
				ctx.addIssue({ code: "custom", path: ["REDIS_PASSWORD"], message: "Required in production" });
			}
		}
	});

const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ""));

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
	console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
	process.exit(1);
}

export const envVars = parsed.data;
export const isProduction = envVars.NODE_ENV === "production";
