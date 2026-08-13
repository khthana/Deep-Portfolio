import axios from "axios";
import { env } from "../configs/env";
import { singleFlight } from "../utils/single-flight";
import { messageToCarry } from "../utils/api-error";

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
 * waits on the same attempt, rather than each posting its own /auth/refresh and
 * minting an access token that the next one immediately overwrites.
 *
 * This used to be a `isRefreshing` boolean, and a request that found it set was
 * rejected outright — the first 401 of a burst renewed the session and the rest
 * failed anyway, which is what put a loaded page back on the login screen.
 *
 * When the attempt is refused rather than lost — a 401 from the API, not a
 * network error — the API clears both cookies on the way out (#55), so the
 * /login this sends everyone to is reached with no session left on the
 * browser, rather than with a pair it cannot spend.
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
    // Before anything else, because this is the only point every failed
    // request passes through while it still has the response on it. A rejected
    // thunk keeps `name`, `message`, `stack` and `code` and drops the rest, so
    // by the time a component catches one the body is gone, and whatever axios
    // wrote is what the user gets shown in its place (#51).
    //
    // Assigned unconditionally, including to the empty string: a failure with
    // no body to quote is one axios named in English for a developer, and
    // leaving that behind is how "Network Error" reaches a teacher. Clearing it
    // is what lets every reader downstream treat a message as the API's own
    // words and fall back to Thai when there are none. The status, the `code`
    // and the response itself are untouched, so nothing diagnostic is lost.
    error.message = messageToCarry(error);

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
