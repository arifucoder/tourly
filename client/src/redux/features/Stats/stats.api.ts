import { baseApi } from "@/redux/baseApi";
import type {
	IBookingStats,
	IDashboardStats,
	IPaymentStats,
	IPublicStats,
	IResponse,
	ITourStats,
	IUserStats,
} from "@/types";

export const statsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPublicStats: builder.query<IPublicStats, void>({
			query: () => ({ url: "/stats/public", method: "GET" }),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<IPublicStats>) => response.data,
		}),
		getDashboardStats: builder.query<IDashboardStats, 7 | 14 | 30>({
			query: (days) => ({ url: "/stats/dashboard", method: "GET", params: { days } }),
			providesTags: ["STATS", "BOOKING"],
			transformResponse: (response: IResponse<IDashboardStats>) => response.data,
		}),
		getBookingStats: builder.query<IBookingStats, void>({
			query: () => ({ url: "/stats/booking", method: "GET" }),
			providesTags: ["STATS", "BOOKING"],
			transformResponse: (response: IResponse<IBookingStats>) => response.data,
		}),
		getPaymentStats: builder.query<IPaymentStats, void>({
			query: () => ({ url: "/stats/payment", method: "GET" }),
			providesTags: ["STATS", "BOOKING"],
			transformResponse: (response: IResponse<IPaymentStats>) => response.data,
		}),
		getUserStats: builder.query<IUserStats, void>({
			query: () => ({ url: "/stats/user", method: "GET" }),
			providesTags: ["STATS", "USERS"],
			transformResponse: (response: IResponse<IUserStats>) => response.data,
		}),
		getTourStats: builder.query<ITourStats, void>({
			query: () => ({ url: "/stats/tour", method: "GET" }),
			providesTags: ["STATS", "TOUR"],
			transformResponse: (response: IResponse<ITourStats>) => response.data,
		}),
	}),
});

export const {
	useGetDashboardStatsQuery,
	useGetBookingStatsQuery,
	useGetPaymentStatsQuery,
	useGetUserStatsQuery,
	useGetTourStatsQuery,
	useGetPublicStatsQuery,
} = statsApi;
