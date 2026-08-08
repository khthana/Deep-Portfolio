import axios from "axios";

export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: BACKEND_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // The two requests that must never trigger a refresh: refreshing is what
    // they are, or what they replace. Everything else — including GET /auth,
    // which is the first request every page load makes — is allowed one
    // attempt, and that is the only thing keeping a session alive past the
    // fifteen minutes an access token lasts.
    const isAuthRoute =
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/google");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("/auth/refresh");

        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (err) {
        isRefreshing = false;

        // redirect login แค่ครั้งเดียว
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);
