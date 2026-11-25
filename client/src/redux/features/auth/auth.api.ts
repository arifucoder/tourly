import { baseApi } from "@/redux/baseApi";
import type { IResponse, ISendOtp, IVerifyOtp } from "@/types";

export const authApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation({
			query: (userInfo) => ({
				url: "/auth/login",
				method: "POST",
				data: userInfo,
			}),
			invalidatesTags: ["USER"],
		}),
		logout: builder.mutation({
			query: () => ({
				url: "/auth/logout",
				method: "POST",
			}),
			invalidatesTags: ["USER"],
		}),
		register: builder.mutation({
			query: (userInfo) => ({
				url: "/user/register",
				method: "POST",
				data: userInfo,
			}),
		}),

		sendOtp: builder.mutation<IResponse<null>, ISendOtp>({
			query: (userInfo) => ({
				url: "/otp/send",
				method: "POST",
				data: userInfo,
			}),
		}),
		verifyOtp: builder.mutation<IResponse<null>, IVerifyOtp>({
			query: (userInfo) => ({
				url: "/otp/verify",
				method: "POST",
				data: userInfo,
			}),
		}),
		forgotPassword: builder.mutation<IResponse<null>, { email: string }>({
			query: (payload) => ({
				url: "/auth/forgot-password",
				method: "POST",
				data: payload,
			}),
		}),
		resetPassword: builder.mutation<IResponse<null>, { id: string; token: string; newPassword: string }>({
			query: ({ token, ...payload }) => ({
				url: "/auth/reset-password",
				method: "POST",
				data: payload,
				headers: { Authorization: `Bearer ${token}` },
			}),
		}),
		changePassword: builder.mutation<IResponse<null>, { oldPassword: string; newPassword: string }>({
			query: (data) => ({ url: "/auth/change-password", method: "POST", data }),
		}),
		setPassword: builder.mutation<IResponse<null>, { password: string }>({
			query: (data) => ({ url: "/auth/set-password", method: "POST", data }),
			invalidatesTags: ["USER"],
		}),
		userInfo: builder.query({
			query: () => ({
				url: "/user/me",
				method: "GET",
			}),
			providesTags: ["USER"],
		}),
	}),
});

export const {
	useRegisterMutation,
	useLoginMutation,
	useSendOtpMutation,
	useVerifyOtpMutation,
	useUserInfoQuery,
	useLogoutMutation,
	useForgotPasswordMutation,
	useResetPasswordMutation,
	useChangePasswordMutation,
	useSetPasswordMutation,
} = authApi;
