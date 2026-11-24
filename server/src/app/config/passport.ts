/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { IsActive, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { envVars } from "./env";

passport.use(
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
		},
		async (email: string, password: string, done) => {
			try {
				const isUserExist = await User.findOne({ email });

				if (!isUserExist) {
					return done("User does not exist");
				}

				if (!isUserExist.isVerified) {
					return done("User is not verified");
				}

				if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
					return done(`User is ${isUserExist.isActive}`);
				}
				if (isUserExist.isDeleted) {
					return done("User is deleted");
				}

				const isGoogleAuthenticated = isUserExist.auths.some((providerObjects) => providerObjects.provider == "google");

				if (isGoogleAuthenticated && !isUserExist.password) {
					return done(null, false, {
						message:
							"You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.",
					});
				}

				const isPasswordMatched = await bcryptjs.compare(password as string, isUserExist.password as string);

				if (!isPasswordMatched) {
					return done(null, false, { message: "Password does not match" });
				}

				return done(null, isUserExist);
			} catch (error) {
				console.log(error);
				done(error);
			}
		},
	),
);

passport.use(
	new GoogleStrategy(
		{
			clientID: envVars.GOOGLE_CLIENT_ID,
			clientSecret: envVars.GOOGLE_CLIENT_SECRET,
			callbackURL: envVars.GOOGLE_CALLBACK_URL,
		},
		async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
			try {
				const email = profile.emails?.[0]?.value;

				if (!email) {
					return done(null, false, { message: "No email found" });
				}

				let user = await User.findOne({ email });

				if (user) {
					if (user.isDeleted) {
						return done(null, false, { message: "User is deleted" });
					}

					if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
						return done(null, false, { message: `User is ${user.isActive}` });
					}

					if (!user.isVerified) {
						return done(null, false, { message: "User is not verified" });
					}

					const hasGoogle = user.auths?.some((a) => a.provider === "google");
					if (!hasGoogle) {
						user.auths.push({ provider: "google", providerId: profile.id });
						await user.save();
					}
				} else {
					user = await User.create({
						email,
						name: profile.displayName,
						picture: profile.photos?.[0]?.value,
						role: Role.USER,
						isVerified: true,
						auths: [{ provider: "google", providerId: profile.id }],
					});
				}

				return done(null, user);
			} catch (error) {
				console.log("Google Strategy Error", error);
				return done(error);
			}
		},
	),
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
	done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		console.log(error);
		done(error);
	}
});
