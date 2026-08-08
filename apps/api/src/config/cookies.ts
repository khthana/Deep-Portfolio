import type { CookieOptions } from "express";
import { env } from "./env";

/**
 * The attributes of the session cookies, written once and used by everything
 * that sets or clears them.
 *
 * This is not tidiness. A cookie is identified by name, domain and path, so
 * res.clearCookie only deletes anything when it is handed the same domain and
 * path res.cookie was handed. The two sides used to be spelled out separately
 * at each call site and had drifted: login set the cookie on "localhost" in
 * development while logout cleared it on "portfolio-api.deep-core.net", so
 * logging out expired a cookie that did not exist and left the live one in
 * place. One function means they cannot drift again.
 *
 * COOKIE_DOMAIN blank — the default — omits the Domain attribute entirely,
 * which makes the cookie host-only: sent back to the host that set it and
 * nowhere else. That is the right shape for a local server, and for any
 * deployment where the API is a single host. Set it only when the cookie has
 * to be readable across subdomains.
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}
