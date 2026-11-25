import { baseApi } from "@/redux/baseApi";
import type { IMeta, IResponse, ITour, ITourFilterOptions, ITourType } from "@/types";
type TToursParams = {
	page?: number;
	limit?: number;
	searchTerm?: string;
	sort?: string;
	division?: string;
	tourType?: string;
	location?: string;
	minPrice?: number;
	maxPrice?: number;
	fields?: string;
};
export const tourApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getTours: builder.query<{ data: ITour[]; meta: IMeta }, TToursParams | void>({
			query: (params) => ({
				url: "/tour",
				method: "GET",
				params: params ?? undefined,
			}),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITour[]> & { meta: IMeta }) => ({
				data: response.data,
				meta: response.meta,
			}),
		}),
		getTourFilterOptions: builder.query<ITourFilterOptions, void>({
			query: () => ({
				url: "/tour/filter-options",
				method: "GET",
			}),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITourFilterOptions>) => response.data,
		}),
		getTrendingTours: builder.query<ITour[], number | void>({
			query: (limit) => ({
				url: "/tour/trending",
				method: "GET",
				params: { limit: limit ?? 4 },
			}),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITour[]>) => response.data,
		}),
		getSingleTour: builder.query<ITour, string>({
			query: (slug) => ({
				url: `/tour/${slug}`,
				method: "GET",
			}),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITour>) => response.data,
		}),
		addTour: builder.mutation({
			query: (tourData: FormData) => ({
				url: "/tour/create",
				method: "POST",
				data: tourData,
			}),
			invalidatesTags: ["TOUR"],
		}),
		updateTour: builder.mutation<ITour, { id: string; formData: FormData }>({
			query: ({ id, formData }) => ({
				url: `/tour/${id}`,
				method: "PATCH",
				data: formData,
			}),
			invalidatesTags: ["TOUR", "STATS"],
			transformResponse: (response: IResponse<ITour>) => response.data,
		}),
		removeTour: builder.mutation({
			query: (tourId: string) => ({
				url: `/tour/${tourId}`,
				method: "DELETE",
			}),
			invalidatesTags: ["TOUR"],
		}),

		addTourType: builder.mutation({
			query: (tourTypeName) => ({
				url: "/tour/create-tour-type",
				method: "POST",
				data: tourTypeName,
			}),
			invalidatesTags: ["TOUR"],
		}),
		updateTourType: builder.mutation<ITourType, { id: string; name: string }>({
			query: ({ id, name }) => ({
				url: `/tour/tour-types/${id}`,
				method: "PATCH",
				data: { name },
			}),
			invalidatesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITourType>) => response.data,
		}),
		removeTourType: builder.mutation({
			query: (tourTypeId) => ({
				url: `/tour/tour-types/${tourTypeId}`,
				method: "DELETE",
			}),
			invalidatesTags: ["TOUR"],
		}),
		getTourTypes: builder.query<ITourType[], void>({
			query: () => ({
				url: "/tour/tour-types",
				method: "GET",
			}),
			providesTags: ["TOUR"],
			transformResponse: (response: IResponse<ITourType[]>) => response.data,
		}),
	}),
});

export const {
	useGetTourFilterOptionsQuery,
	useGetSingleTourQuery,
	useGetTrendingToursQuery,
	useGetToursQuery,
	useRemoveTourMutation,
	useAddTourMutation,
	useGetTourTypesQuery,
	useAddTourTypeMutation,
	useRemoveTourTypeMutation,
	useUpdateTourMutation,
	useUpdateTourTypeMutation,
} = tourApi;
