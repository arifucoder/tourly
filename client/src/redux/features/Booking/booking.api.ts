import { baseApi } from "@/redux/baseApi";
import type {
	IAdminBooking,
	IAssignedBooking,
	IAvailableGuide,
	IBookingDetail,
	IMeta,
	IResponse,
	TAssignedScope,
	TBookingStatus,
} from "@/types";

type TCreateBookingPayload = { tour: string; guestCount: number };
type TCreateBookingResponse = { paymentUrl: string; booking: unknown };

export type TAdminBookingsParams = {
	page?: number;
	limit?: number;
	status?: TBookingStatus;
	searchTerm?: string;
	from?: string;
	to?: string;
};

type TBookingCounts = Record<TBookingStatus | "ALL", number>;

export const bookingApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		createBooking: builder.mutation<TCreateBookingResponse, TCreateBookingPayload>({
			query: (payload) => ({
				url: "/booking",
				method: "POST",
				data: payload,
			}),
			transformResponse: (response: IResponse<TCreateBookingResponse>) => response.data,
			invalidatesTags: ["BOOKING"],
		}),
		getAllBookings: builder.query<{ data: IAdminBooking[]; meta: IMeta }, TAdminBookingsParams>({
			query: (params) => ({ url: "/booking", method: "GET", params }),
			providesTags: ["BOOKING"],
			transformResponse: (response: IResponse<IAdminBooking[]> & { meta: IMeta }) => ({
				data: response.data,
				meta: response.meta,
			}),
		}),
		getBookingSummary: builder.query<TBookingCounts, { from?: string; to?: string }>({
			query: (params) => ({ url: "/booking/summary", method: "GET", params }),
			providesTags: ["BOOKING"],
			transformResponse: (response: IResponse<{ counts: TBookingCounts }>) => response.data.counts,
		}),
		getBooking: builder.query<IBookingDetail, string>({
			query: (id) => ({ url: `/booking/${id}`, method: "GET" }),
			providesTags: ["BOOKING"],
			transformResponse: (response: IResponse<IBookingDetail>) => response.data,
		}),
		updateBookingStatus: builder.mutation<unknown, { id: string; status: TBookingStatus }>({
			query: ({ id, status }) => ({ url: `/booking/${id}/status`, method: "PATCH", data: { status } }),
			invalidatesTags: ["BOOKING", "STATS"],
		}),
		getAvailableGuides: builder.query<{ currentGuide: string | null; guides: IAvailableGuide[] }, string>({
			query: (id) => ({ url: `/booking/${id}/available-guides`, method: "GET" }),
			providesTags: ["BOOKING"],
			transformResponse: (response: IResponse<{ currentGuide: string | null; guides: IAvailableGuide[] }>) =>
				response.data,
		}),
		getAssignedBookings: builder.query<
			{ data: IAssignedBooking[]; meta: IMeta },
			{ scope: TAssignedScope; page?: number; limit?: number }
		>({
			query: (params) => ({ url: "/booking/assigned", method: "GET", params }),
			providesTags: ["BOOKING"],
			transformResponse: (response: IResponse<IAssignedBooking[]> & { meta: IMeta }) => ({
				data: response.data,
				meta: response.meta,
			}),
		}),
		assignGuide: builder.mutation<unknown, { id: string; guide: string | null }>({
			query: ({ id, guide }) => ({ url: `/booking/${id}/assign-guide`, method: "PATCH", data: { guide } }),
			invalidatesTags: ["BOOKING"],
		}),
	}),
});

export const {
	useCreateBookingMutation,
	useGetAllBookingsQuery,
	useGetBookingSummaryQuery,
	useGetBookingQuery,
	useUpdateBookingStatusMutation,
	useGetAvailableGuidesQuery,
	useAssignGuideMutation,
	useGetAssignedBookingsQuery,
} = bookingApi;
