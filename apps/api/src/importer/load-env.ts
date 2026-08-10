import dotenv from "dotenv";

/**
 * Reads apps/api/.env, and must be imported before anything that builds a
 * Prisma client.
 *
 * The server gets this for free: it imports src/config/env.ts, which calls
 * dotenv itself. The importer cannot reuse that module, because env.ts
 * validates every setting the HTTP server needs — JWT secrets, the Google
 * client id, MinIO credentials — and refuses to start without them. None of
 * those exist as far as an import is concerned; DATABASE_URL is the only thing
 * it touches. Importing env.ts here would mean an administrator could not load
 * a CSV file without first configuring Google sign-in.
 *
 * The import has to be a separate module rather than a dotenv.config() call at
 * the top of cli.ts because ES modules evaluate all of a file's imports before
 * any of its statements. A config() call in cli.ts would therefore run after
 * ../config/prisma had already been evaluated and had already read (or failed
 * to read) DATABASE_URL.
 */

// quiet: everything else this command prints is a report meant for the
// administrator running it, in Thai. dotenv's default startup banner is a note
// to developers and does not belong in the middle of that.
dotenv.config({ quiet: true });
