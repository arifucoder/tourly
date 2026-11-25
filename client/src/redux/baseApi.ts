import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./axiosBaseQuery";

export const baseApi = createApi({
	reducerPath: "baseApi",
	baseQuery: axiosBaseQuery(),
	tagTypes: ["USER", "USERS", "TOUR", "DIVISION", "BOOKING", "GUIDE_APPLICATION", "STATS"],
	endpoints: () => ({}),
});
