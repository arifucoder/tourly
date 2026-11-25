import { baseApi } from "@/redux/baseApi";
import type { IGuideApplication, IMeta, IResponse, TApplicationStatus } from "@/types";

type TApplicationsParams = {
	page?: number;
	limit?: number;
	status?: TApplicationStatus;
	division?: string;
	searchTerm?: string;
};

type TApplicationCounts = Record<TApplicationStatus | "ALL", number>;

export const guideApplicationApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getGuideApplications: builder.query<{ data: IGuideApplication[]; meta: IMeta }, TApplicationsParams>({
			query: (params) => ({ url: "/guide-application", method: "GET", params }),
			providesTags: ["GUIDE_APPLICATION"],
			transformResponse: (response: IResponse<IGuideApplication[]> & { meta: IMeta }) => ({
				data: response.data,
				meta: response.meta,
			}),
		}),
		getGuideApplicationSummary: builder.query<TApplicationCounts, void>({
			query: () => ({ url: "/guide-application/summary", method: "GET" }),
			providesTags: ["GUIDE_APPLICATION"],
			transformResponse: (response: IResponse<{ counts: TApplicationCounts }>) => response.data.counts,
		}),
		getMyGuideApplications: builder.query<IGuideApplication[], void>({
			query: () => ({ url: "/guide-application/me", method: "GET" }),
			providesTags: ["GUIDE_APPLICATION"],
			transformResponse: (response: IResponse<IGuideApplication[]>) => response.data,
		}),
		applyAsGuide: builder.mutation<
			IGuideApplication,
			{ division: string; experienceYears: number; languages: string[]; message: string }
		>({
			query: (data) => ({ url: "/guide-application", method: "POST", data }),
			invalidatesTags: ["GUIDE_APPLICATION"],
			transformResponse: (response: IResponse<IGuideApplication>) => response.data,
		}),
		withdrawGuideApplication: builder.mutation<null, string>({
			query: (id) => ({ url: `/guide-application/me/${id}`, method: "DELETE" }),
			invalidatesTags: ["GUIDE_APPLICATION"],
		}),
		reviewGuideApplication: builder.mutation<
			IGuideApplication,
			{ id: string; status: Exclude<TApplicationStatus, "PENDING">; reviewNote?: string }
		>({
			query: ({ id, ...data }) => ({ url: `/guide-application/${id}/review`, method: "PATCH", data }),
			invalidatesTags: ["GUIDE_APPLICATION", "USERS", "STATS"],
			transformResponse: (response: IResponse<IGuideApplication>) => response.data,
		}),
	}),
});

export const {
	useGetGuideApplicationsQuery,
	useGetGuideApplicationSummaryQuery,
	useReviewGuideApplicationMutation,
	useGetMyGuideApplicationsQuery,
	useApplyAsGuideMutation,
	useWithdrawGuideApplicationMutation,
} = guideApplicationApi;
