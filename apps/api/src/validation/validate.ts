import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { formatPath, thaiMessage } from "./messages";
import { FieldError, FieldLocation, ValidationError } from "./validation-error";

/**
 * The one place a request's input is checked, and the only way a controller is
 * allowed to read it.
 *
 *     // route
 *     courseRouter.get("/", validate({ query: courseDetailQuery }), handler);
 *
 *     // controller
 *     const { section_id } = validated(req, courseDetailQuery);
 *
 * The pair is deliberate. `validate` runs the schema; `validated` hands back
 * what it produced, typed by the same schema object the route named. Naming the
 * schema twice is what makes the type real — the controller is not asserting a
 * shape it hopes the route provides, it is asking for the output of one
 * particular schema, and asking for one the route did not run throws rather
 * than returning something unchecked.
 *
 * Nothing on `req` is overwritten. A controller that still reads `req.body`
 * gets the untouched request, which is what keeps a half-migrated endpoint
 * obvious rather than quiet: coerced values exist only behind `validated`.
 *
 * See D8 in docs/spec-refactor-redeploy.md, and issue #20.
 */

const LOCATIONS = ["params", "query", "body"] as const;

/** The schemas one route runs, by where the data comes from. */
export interface RequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

/**
 * Parsed input, keyed by the schema that produced it.
 *
 * A `Map` keyed on the schema object rather than by location, so `validated`
 * can tell "this route did not validate a body" from "this route validated a
 * different body than you are asking for". Both are wiring mistakes, and both
 * should stop the request loudly.
 */
const PARSED = Symbol("validated request input");

type WithParsed = Request & { [PARSED]?: Map<z.ZodType, unknown> };

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const parsed = new Map<z.ZodType, unknown>();
    const errors: FieldError[] = [];

    for (const location of LOCATIONS) {
      const schema = schemas[location];

      if (!schema) {
        continue;
      }

      const input = req[location];
      const result = schema.safeParse(input);

      if (result.success) {
        parsed.set(schema, result.data);
      } else {
        errors.push(...toFieldErrors(result.error, input, location));
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors));
    }

    (req as WithParsed)[PARSED] = parsed;
    next();
  };
}

/**
 * What `schema` made of this request.
 *
 * Throws when the route did not run it. That is not a caller's mistake and must
 * not be answered with a 4xx — it means a route and its controller disagree
 * about what was validated, and the request that reaches the controller has
 * unchecked input in it. The 500 it becomes is the honest answer.
 */
export function validated<S extends z.ZodType>(
  req: Request,
  schema: S,
): z.output<S> {
  const parsed = (req as WithParsed)[PARSED];

  if (!parsed?.has(schema)) {
    throw new Error(
      "Reading input that this route never validated — the schema passed to " +
        "validated() is not one the route passed to validate().",
    );
  }

  return parsed.get(schema) as z.output<S>;
}

function toFieldErrors(
  error: z.ZodError,
  input: unknown,
  location: FieldLocation,
): FieldError[] {
  return error.issues.map((issue) => ({
    field: formatPath(issue.path),
    location,
    message: thaiMessage(issue, input),
  }));
}
