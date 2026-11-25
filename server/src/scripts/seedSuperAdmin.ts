/* eslint-disable no-console */
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { envVars } from "../app/config/env";
import { Role, type IAuthProvider, type IUser } from "../app/modules/user/user.interface";
import { User } from "../app/modules/user/user.model";

const seedSuperAdmin = async () => {
	const { SUPER_ADMIN_EMAIL: email, SUPER_ADMIN_PASSWORD: password } = envVars;

	if (!email || !password) {
		throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env to seed the super admin");
	}

	const isSuperAdminExist = await User.findOne({ email });

	if (isSuperAdminExist) {
		console.log(`Super admin already exists: ${email}`);
		return;
	}

	const hashedPassword = await bcryptjs.hash(password, envVars.BCRYPT_SALT_ROUND);

	const authProvider: IAuthProvider = {
		provider: "credentials",
		providerId: email,
	};

	const payload: Omit<IUser, "_id"> = {
		name: "Super admin",
		role: Role.SUPER_ADMIN,
		email,
		password: hashedPassword,
		isVerified: true,
		auths: [authProvider],
	};

	await User.create(payload);
	console.log(`Super admin created: ${email}`);
};

const run = async () => {
	try {
		await mongoose.connect(envVars.DB_URL);
		await seedSuperAdmin();
	} catch (error) {
		console.log("Super admin seed failed", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
};

run();
