import config from "@/config";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
	baseURL: config.baseUrl,
	withCredentials: true,
});

axiosInstance.interceptors.request.use(
	function (config) {
		console.log("Axios", config);
		return config;
	},
	function (error) {
		return Promise.reject(error);
	},
);

let isRefreshing = false;

let pendingQueue: {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown) => {
	pendingQueue.forEach((promise) => {
		if (error) {
			promise.reject(error);
		} else {
			promise.resolve(null);
		}
	});
	pendingQueue = [];
};

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error: AxiosError<{ message?: string }>) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean;
		};

		if (!error.response || !originalRequest) {
			return Promise.reject(error);
		}

		const isRefreshRequest = originalRequest.url?.includes("/auth/refresh-token");

		const isTokenExpired =
			error.response.status === 500 &&
			error.response.data?.message === "jwt expired";

		if (isTokenExpired && !originalRequest._retry && !isRefreshRequest) {
			originalRequest._retry = true;

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					pendingQueue.push({ resolve, reject });
				}).then(() => axiosInstance(originalRequest));
			}

			isRefreshing = true;

			try {
				await axiosInstance.post("/auth/refresh-token");
				processQueue(null);
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError);

				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	},
);
