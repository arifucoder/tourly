import { baseApi } from "@/redux/baseApi";
import type { IMeta, IResponse, IUser, TRole, TUserStatus } from "@/types";

type TUsersParams = {
	page?: number;
	limit?: number;
	searchTerm?: string;
	role?: TRole;
	isActive?: TUserStatus;
	isVerified?: boolean;
	sort?: string;
};

type TUpdateUserPayload = { id: string; role?: TRole; isActive?: TUserStatus };

export const userApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getUsers: builder.query<{ data: IUser[]; meta: IMeta }, TUsersParams>({
			query: (params) => ({ url: "/user/all-users", method: "GET", params }),
			providesTags: ["USERS"],
			transformResponse: (response: IResponse<IUser[]> & { meta: IMeta }) => ({
				data: response.data,
				meta: response.meta,
			}),
		}),
		getUser: builder.query<IUser, string>({
			query: (id) => ({ url: `/user/${id}`, method: "GET" }),
			providesTags: ["USERS"],
			transformResponse: (response: IResponse<IUser>) => response.data,
		}),
		updateMe: builder.mutation<IUser, FormData>({
			query: (data) => ({ url: "/user/me", method: "PATCH", data }),
			invalidatesTags: ["USER"],
			transformResponse: (response: IResponse<IUser>) => response.data,
		}),
		updateUser: builder.mutation<IUser, TUpdateUserPayload>({
			query: ({ id, ...data }) => ({ url: `/user/${id}`, method: "PATCH", data }),
			invalidatesTags: ["USERS", "STATS"],
			transformResponse: (response: IResponse<IUser>) => response.data,
		}),
	}),
});

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserMutation, useUpdateMeMutation } = userApi;
