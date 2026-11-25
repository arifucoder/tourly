import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type { ILogin, ISendOtp, IVerifyOtp } from "./auth.type";
export type { IDivision } from "./division.type";
export type { IMeta, ITour, ITourFilterOption, ITourFilterOptions, ITourType } from "./tour.type";
export type {
	IAdminBooking,
	IAssignedBooking,
	IAvailableGuide,
	IBookingDetail,
	IBookingStats,
	IDashboardStats,
	IGuideApplication,
	IPaymentStats,
	ITourStats,
	IUser,
	IUserStats,
	TApplicationStatus,
	TAssignedScope,
	TBookingStatus,
	TPaymentStatus,
	TUserStatus,
} from "./admin.type";

export interface IResponse<T> {
	statusCode: number;
	success: boolean;
	message: string;
	data: T;
}

export type TApiError = {
	status?: number;
	data?: {
		message?: string;
		errorSources?: { path: string; message: string }[];
	};
};

export interface ISidebarItem {
	title: string;
	items: {
		title: string;
		url: string;
		component: ComponentType;
		icon?: LucideIcon;
		hidden?: boolean;
	}[];
}

export type TRole = "SUPER_ADMIN" | "ADMIN" | "GUIDE" | "USER";
