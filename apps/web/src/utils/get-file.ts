import { env } from "../configs/env";

/**
 * Where a stored file is fetched from.
 *
 * The API hands attachments out as a ready-made path — `/files?path=…&exp=…&sig=…`,
 * signed and short-lived, see ADR-0006 — so the only thing left to say here is
 * which origin serves it. Nothing is appended and nothing is escaped: the query
 * was built by the API, and adding to it would break the signature.
 *
 * A link attachment is an address of its own and must not come through here;
 * callers tell the two apart by whether the value starts with "http".
 */
export const getFile = (src: string) => `${env.BACKEND_URL}${src}`;
