import { baseApi } from "@/redux/baseApi";
import type { IDivision, IResponse } from "@/types";

export const divisionApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		addDivision: builder.mutation({
			query: (divisionData: FormData) => ({
				url: "/division/create",
				method: "POST",
				data: divisionData,
			}),
			invalidatesTags: ["DIVISION"],
		}),
		getDivisions: builder.query<IDivision[], void>({
			query: () => ({
				url: "/division",
				method: "GET",
			}),
			providesTags: ["DIVISION", "TOUR"],
			transformResponse: (response: IResponse<IDivision[]>) => response.data,
		}),
		updateDivision: builder.mutation<IDivision, { id: string; formData: FormData }>({
			query: ({ id, formData }) => ({
				url: `/division/${id}`,
				method: "PATCH",
				data: formData,
			}),
			invalidatesTags: ["DIVISION"],
			transformResponse: (response: IResponse<IDivision>) => response.data,
		}),
		removeDivision: builder.mutation({
			query: (divisionId: string) => ({
				url: `/division/${divisionId}`,
				method: "DELETE",
			}),
			invalidatesTags: ["DIVISION"],
		}),
	}),
});

export const { useAddDivisionMutation, useGetDivisionsQuery, useRemoveDivisionMutation, useUpdateDivisionMutation } =
	divisionApi;
