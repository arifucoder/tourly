import type { TRole } from "./index";

export type TUserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type TBookingStatus = "PENDING" | "COMPLETE" | "CANCEL" | "FAILED";
export type TPaymentStatus = "PAID" | "UNPAID" | "CANCELLED" | "FAILED" | "REFUNDED";
export type TApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IUser {
	_id: string;
	name: string;
	email: string;
	phone?: string;
	picture?: string;
	address?: string;
	role: TRole;
	isActive?: TUserStatus;
	isVerified?: boolean;
	signInMethods?: ("google" | "credentials")[];
	bookingsCount?: number;
	createdAt?: string;
	guideInfo?: {
		via: "ADMIN" | "GUIDE_APPLICATION";
		by: string | null;
		at: string | null;
		divisions: string[];
	} | null;
}

export interface IAdminBooking {
	_id: string;
	bookingCode: string;
	status: TBookingStatus;
	guestCount: number;
	createdAt: string;
	user: { _id: string; name: string; email: string; phone?: string };
	tour: { _id: string; title: string; slug: string; startDate?: string; endDate?: string };
	payment?: { _id: string; transactionId: string; amount: number; status: TPaymentStatus };
	guide?: { _id: string; name: string } | null;
}

export interface IBookingDetail {
	_id: string;
	bookingCode: string;
	status: TBookingStatus;
	guestCount: number;
	createdAt: string;
	expiredAt?: string | null;
	guideAssignedAt?: string | null;
	user: { _id: string; name: string; email: string; phone?: string; address?: string };
	tour: {
		_id: string;
		title: string;
		slug: string;
		images?: string[];
		location?: string;
		startDate?: string;
		endDate?: string;
		costFrom?: number;
		departureLocation?: string;
		arrivalLocation?: string;
		division?: { _id: string; name: string } | null;
		tourType?: { _id: string; name: string } | null;
	};
	payment?: {
		_id: string;
		transactionId: string;
		amount: number;
		status: TPaymentStatus;
		invoiceUrl?: string;
		createdAt?: string;
		updatedAt?: string;
	};
	guide?: { _id: string; name: string; email?: string; phone?: string; picture?: string; contactShared?: boolean } | null;
}

export interface IAvailableGuide {
	_id: string;
	name: string;
	email: string;
	phone?: string;
	picture?: string;
	experienceYears: number;
	languages: string[];
	inDivision: boolean;
	approvedDivisions: string[];
	isAssigned: boolean;
	isAvailable: boolean;
	conflictWith: string | null;
}

export interface IGuideApplication {
	_id: string;
	user: { _id: string; name: string; email: string; phone?: string; picture?: string; address?: string; role?: TRole; createdAt?: string };
	division: { _id: string; name: string; slug: string };
	experienceYears: number;
	languages: string[];
	message: string;
	status: TApplicationStatus;
	reviewedBy?: { _id: string; name: string };
	reviewedAt?: string;
	reviewNote?: string;
	createdAt: string;
}

export interface IDashboardStats {
	period: { days: 7 | 14 | 30; from: string; to: string; timeZone: string };
	today: {
		newBookings: number;
		awaitingPayment: number;
		confirmed: number;
		cancelled: number;
		departingToday: number;
		collected: number;
	};
	series: { date: string; bookings: number; revenue: number }[];
	totals: { revenue: number; bookings: number; newTravellers: number; awaitingPayment: number };
	byTourType: { _id: string; name: string; count: number; percent: number }[];
	byTour: {
		_id: string;
		title: string;
		slug: string;
		bookings: number;
		guests: number;
		revenue: number;
		cancelled: number;
		seatsFilled: number | null;
	}[];
}

type TCountRow = { _id: string; count: number };

export interface IBookingStats {
	totalBooking: number;
	totalBookingByStatus: TCountRow[];
	bookingsPerTour: { _id: string; bookingCount: number; tour: { title: string; slug: string } }[];
	avgGuestCountPerBooking: number;
	bookingsLast7Days: number;
	bookingsLast30Days: number;
	totalBookingByUniqueUsers: number;
}

export interface IPaymentStats {
	totalPayment: number;
	totalPaymentByStatus: TCountRow[];
	totalRevenue: { totalRevenue: number }[];
	avgPaymentAmount: { avgPaymentAMount: number }[];
}

export interface IUserStats {
	totalUsers: number;
	totalActiveUsers: number;
	totalInActiveUsers: number;
	totalBlockedUsers: number;
	newUsersInLast7Days: number;
	newUsersInLast30Days: number;
	usersByRole: TCountRow[];
}

export interface ITourStats {
	totalTour: number;
	totalTourByTourType: TCountRow[];
	avgTourCost: { avgCostFrom: number }[];
	totalTourByDivision: TCountRow[];
}

export type TAssignedScope = "upcoming" | "past" | "all";

export interface IAssignedBooking {
	_id: string;
	bookingCode: string;
	status: TBookingStatus;
	guestCount: number;
	guideAssignedAt?: string;
	createdAt: string;
	user: { _id: string; name: string; email: string; phone?: string };
	tour: {
		_id: string;
		title: string;
		slug: string;
		images?: string[];
		location?: string;
		startDate?: string;
		endDate?: string;
		departureLocation?: string;
		arrivalLocation?: string;
		division?: { _id: string; name: string } | null;
	};
}

export interface IMyBooking {
	_id: string;
	bookingCode?: string;
	status: TBookingStatus;
	guestCount: number;
	createdAt: string;
	expiredAt?: string | null;
	tour: {
		_id: string;
		title: string;
		slug: string;
		images?: string[];
		location?: string;
		startDate?: string;
		endDate?: string;
		costFrom?: number;
	} | null;
	payment?: {
		_id: string;
		transactionId: string;
		amount: number;
		status: TPaymentStatus;
		invoiceUrl?: string;
		updatedAt?: string;
	} | null;
}

export interface IMyBookingSummary {
	counts: Record<TBookingStatus | "ALL", number>;
	upcomingTrips: number;
	completedTrips: number;
	pendingAmount: number;
	totalSpent: number;
}

export interface IMe {
	_id: string;
	name: string;
	email: string;
	phone?: string;
	address?: string;
	picture?: string;
	role: TRole;
	isVerified?: boolean;
	isActive?: TUserStatus;
	hasPassword: boolean;
	signInMethods: ("google" | "credentials")[];
	createdAt?: string;
}

export interface IPublicStats {
	tours: number;
	divisions: number;
	departuresThisMonth: number;
	maxGroupSize: number | null;
}
