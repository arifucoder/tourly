import type { Types } from "mongoose";

export enum Role {
	SUPER_ADMIN = "SUPER_ADMIN",
	ADMIN = "ADMIN",
	USER = "USER",
	GUIDE = "GUIDE",
}

export interface IAuthProvider {
	provider: "google" | "credentials";
	providerId: string;
}

export enum IsActive {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
	BLOCKED = "BLOCKED",
}

export type TRoleChangeVia = "ADMIN" | "GUIDE_APPLICATION";

export interface IRoleChange {
	by?: Types.ObjectId;
	at: Date;
	via: TRoleChangeVia;
}

export interface IUser {
	_id: Types.ObjectId;
	name: string;
	email: string;
	password?: string;
	phone?: string;
	picture?: string;
	address?: string;
	isDeleted?: boolean;
	isActive?: IsActive;
	isVerified?: boolean;
	role: Role;
	auths: IAuthProvider[];
	bookings?: Types.ObjectId[];
	guides?: Types.ObjectId[];
	roleChange?: IRoleChange;
	createdAt?: Date;
}
