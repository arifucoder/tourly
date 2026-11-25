import crypto from "crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";

const COOKIE_NAME = "oauth_state";

const cookieOptions: CookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: "lax",
	path: "/api/v1/auth/google",
	maxAge: 10 * 60 * 1000,
};

const toSafePath = (value: unknown) => {
	const path = typeof value === "string" ? value : "/";
	return path.startsWith("/") && !path.startsWith("//") ? path : "/";
};

export const createOAuthState = (res: Response, redirect: unknown) => {
	const nonce = crypto.randomBytes(16).toString("hex");
	res.cookie(COOKIE_NAME, nonce, cookieOptions);
	return `${nonce}.${Buffer.from(toSafePath(redirect)).toString("base64url")}`;
};

export const verifyOAuthState = (req: Request, res: Response, next: NextFunction) => {
	const [nonce, encodedPath] = String(req.query.state ?? "").split(".");
	const expected = req.cookies?.[COOKIE_NAME];

	res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });

	const isValid =
		typeof expected === "string" &&
		typeof nonce === "string" &&
		nonce.length === expected.length &&
		crypto.timingSafeEqual(Buffer.from(nonce), Buffer.from(expected));

	if (!isValid) {
		res.redirect(`${envVars.FRONTEND_URL}/login?error=${encodeURIComponent("Google sign-in expired. Please try again.")}`);
		return;
	}

	res.locals.oauthRedirect = toSafePath(Buffer.from(encodedPath ?? "", "base64url").toString());
	next();
};
