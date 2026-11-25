import { model, Schema } from "mongoose";
import { IsActive, Role, type IAuthProvider, type IUser } from "./user.interface";

const removePassword = (ret: Record<string, unknown>) => {
	delete ret.password;
	return ret;
};

const authProviderSchema = new Schema<IAuthProvider>(
	{
		provider: { type: String, required: true },
		providerId: { type: String, required: true },
	},
	{
		versionKey: false,
		_id: false,
	},
);

const userSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, select: false },
		role: {
			type: String,
			enum: Object.values(Role),
			default: Role.USER,
		},
		phone: { type: String },
		picture: { type: String },
		address: { type: String },
		isDeleted: { type: Boolean, default: false },
		isActive: {
			type: String,
			enum: Object.values(IsActive),
			default: IsActive.ACTIVE,
		},
		isVerified: { type: Boolean, default: false },
		auths: [authProviderSchema],
	},
	{
		timestamps: true,
		versionKey: false,
		toJSON: { transform: (_doc, ret) => removePassword(ret) },
		toObject: { transform: (_doc, ret) => removePassword(ret) },
	},
);

export const User = model<IUser>("User", userSchema);
