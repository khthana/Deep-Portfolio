import axios from "axios";
import { env } from "../configs/env";
import { singleFlight } from "../utils/single-flight";

export const BACKEND_API_URL = env.BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: BACKEND_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * One refresh at a time, shared by everybody who needs it.
 *
 * A page load fires several requests at once, so an expired access token comes
 * back as a burst of 401s rather than a single one. Every request in that burst
 * waits on the same attempt: the API rotates the refresh token on each use, so
 * two refreshes racing means the second spends a token the first has already
 * replaced, and the session ends on a request that should have renewed it.
 *
 * This used to be a `isRefreshing` boolean, and a request that found it set was
 * rejected outright — the first 401 of a burst renewed the session and the rest
 * failed anyway, which is what put a loaded page back on the login screen.
 */
const refreshSession = singleFlight(async () => {
  try {
    await axiosInstance.post("/auth/refresh");
  } catch (err) {
    // Once per failed attempt rather than once per waiting request: the
    // assignment does not navigate on the spot, so waiters checking the
    // pathname for themselves would each still see the old one.
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw err;
  }
});

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
      originalRequest._retry = true;

      await refreshSession();

      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  },
);
