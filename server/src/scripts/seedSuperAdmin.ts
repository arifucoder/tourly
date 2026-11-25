/* eslint-disable no-console */
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { envVars } from "../app/config/env";
import { Role, type IAuthProvider, type IUser } from "../app/modules/user/user.interface";
import { User } from "../app/modules/user/user.model";

const seedSuperAdmin = async () => {
	const isSuperAdminExist = await User.findOne({ email: envVars.SUPER_ADMIN_EMAIL });

	if (isSuperAdminExist) {
		console.log(`Super admin already exists: ${envVars.SUPER_ADMIN_EMAIL}`);
		return;
	}

	const hashedPassword = await bcryptjs.hash(envVars.SUPER_ADMIN_PASSWORD, Number(envVars.BCRYPT_SALT_ROUND));

	const authProvider: IAuthProvider = {
		provider: "credentials",
		providerId: envVars.SUPER_ADMIN_EMAIL,
	};

	const payload: Omit<IUser, "_id"> = {
		name: "Super admin",
		role: Role.SUPER_ADMIN,
		email: envVars.SUPER_ADMIN_EMAIL,
		password: hashedPassword,
		isVerified: true,
		auths: [authProvider],
	};

	await User.create(payload);
	console.log(`Super admin created: ${envVars.SUPER_ADMIN_EMAIL}`);
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
