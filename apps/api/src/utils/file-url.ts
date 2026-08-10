import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../config/env";
import { HttpError } from "./http-error";

/**
 * The URL a stored file is fetched from, and the proof that this API is the one
 * that handed it out.
 *
 * `GET /files` streams straight out of the bucket, and it used to do that for
 * anyone who could name an object key — no session, no ownership, no expiry.
 * Putting `requireUser` in front of it would not have been enough: keys reach
 * the browser as `<img src>` and `<a href>`, and in development the web app is
 * a different origin from the API, so the session cookie (SameSite=Lax) does
 * not ride along with those requests at all.
 *
 * So the permission is decided where the key is handed out instead. Every key
 * leaves through `AttachmentsService.getAttachments`, which is reached only
 * through an endpoint that has already decided whether this caller may see the
 * record the file hangs off — including the public share link, which is meant
 * to be readable without logging in. What travels to the browser is the
 * decision itself, as a signature `/files` can check on its own.
 *
 * See docs/adr/0006-file-access.md.
 */

/**
 * How long a minted URL stays good for. Long enough to open a page and read
 * everything on it without a link going stale mid-scroll; short enough that a
 * URL copied out of the address bar and pasted elsewhere is not a lasting way
 * in.
 */
const TTL_SECONDS = 60 * 60;

/**
 * A key of this route's own, rather than `JWT_SECRET` itself. The two uses stay
 * separated: nothing signed here can be presented as a session, and nothing the
 * session code signs can name a file.
 *
 * Derived rather than configured because `env.ts` refuses fallbacks for secrets
 * — see the note at the top of it — so a `FILE_URL_SECRET` would have to be
 * required, and a project whose promise is `docker compose up` would gain one
 * more value that has to be set before anything starts. Rotating `JWT_SECRET`
 * rotates this with it, which costs at most an hour of live links.
 */
const SIGNING_KEY = createHmac("sha256", env.JWT_SECRET)
  .update("deep-portfolio/file-url/v1")
  .digest();

/**
 * Signed over the exact text that travels in the query rather than over parsed
 * values, so nothing has to be interpreted before the signature is known to be
 * good — a nonsense `exp` fails the signature and is never read as a number.
 */
const sign = (objectKey: string, expiresAt: string) =>
  createHmac("sha256", SIGNING_KEY)
    .update(`${objectKey}\n${expiresAt}`)
    .digest("base64url");

/** Constant-time, and length-checked first because `timingSafeEqual` throws on
 *  buffers of different sizes rather than answering false. */
function matches(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);

  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The path `GET /files` will serve this object from, until it expires.
 *
 * Relative on purpose: the API is not told its own public origin anywhere, and
 * the web app already knows where the API is — it is the one value it needs to
 * be built with. `apps/web/src/utils/get-file.ts` puts the two together.
 */
export function signFileUrl(objectKey: string, now = Date.now()): string {
  const expiresAt = String(Math.floor(now / 1000) + TTL_SECONDS);

  const query = new URLSearchParams({
    path: objectKey,
    exp: expiresAt,
    sig: sign(objectKey, expiresAt),
  });

  return `/files?${query}`;
}

/**
 * Refuse a request for a file this API did not hand out, or handed out too long
 * ago.
 *
 * A missing signature is answered `403` rather than the `400` a missing field
 * usually gets here. The signature is not a shape this endpoint needs in order
 * to understand the request — it is the whole of the permission — so a request
 * without one is not malformed, it is unauthorised, and answering it 400 would
 * describe the refusal as a typo.
 *
 * Expiry is `410` rather than another `403`, because the two want different
 * things from whoever is reading. A bad signature means the link was never
 * ours; an expired one means the page has been open too long and reloading it
 * will work.
 */
export function assertSignedFileUrl(query: {
  path: string;
  exp?: string;
  sig?: string;
}): void {
  const { path, exp, sig } = query;

  if (exp === undefined || sig === undefined || !matches(sign(path, exp), sig)) {
    throw new HttpError(403, "ลิงก์ไฟล์นี้ไม่ถูกต้อง");
  }

  if (Number(exp) * 1000 <= Date.now()) {
    throw new HttpError(410, "ลิงก์ไฟล์นี้หมดอายุแล้ว กรุณาโหลดหน้านี้ใหม่");
  }
}
