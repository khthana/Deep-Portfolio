import { Prisma } from "@prisma/client";
import { HttpError } from "./http-error";

/**
 * "The row this operation addressed is not there" — Prisma's answer, turned
 * into the caller's.
 *
 * `update` and `delete` do not report a missing row by returning null; they
 * throw. Nothing recognised that throw, so it reached the error handler as an
 * error nobody anticipated and left as a 500: the caller was told the server
 * had broken when what had happened was that they had asked for something that
 * is not there (#42, pinned since #16/#17).
 *
 * Two levels catch it now. `errorHandler` answers 404 for any P2025 at all, so
 * an endpoint nobody thought about still says the right thing. `orNotFound`
 * sits at the call sites that already own a sentence for this resource, so
 * `DELETE` and `GET` name the same missing row the same way.
 */

/** Prisma's code for an operation whose target row was required and absent. */
const RECORD_NOT_FOUND = "P2025";

export function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND
  );
}

/**
 * Await `work`, and if what it addressed is gone, refuse in this resource's own
 * words.
 *
 *     await orNotFound(this.service.deletePortfolioAward(id), NOT_FOUND);
 *
 * Takes the factory rather than the error so that nothing is constructed on the
 * path where nothing is wrong, and so the stack belongs to the throw.
 *
 * Only P2025 is translated. Every other failure goes on untouched — a unique
 * collision and a foreign key are different news with different answers, and
 * guessing at them here would be how a 500 that means something becomes a 404
 * that does not (#42 leaves both out of scope on purpose).
 *
 * Wrap the narrowest promise that can mean what the sentence says. This catches
 * any P2025 raised anywhere inside `work`, including one from a nested write,
 * and answers all of them in the words of the row the caller addressed. Every
 * current call site is a service whose only P2025 is that row's.
 */
export async function orNotFound<T>(
  work: Promise<T>,
  notFound: () => HttpError,
): Promise<T> {
  try {
    return await work;
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw notFound();
    }

    throw error;
  }
}
