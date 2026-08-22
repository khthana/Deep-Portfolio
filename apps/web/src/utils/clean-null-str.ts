/**
 * Turns the strings "null" and "undefined" into "", everywhere in a value.
 *
 * They arrive that way from a form that stringified a missing field on the way
 * in, so the column holds the four letters rather than a null and every screen
 * that shows it would print them.
 *
 * Generic rather than `any`: the walk rewrites strings into strings, arrays
 * into arrays of the same length and objects into objects with the same keys,
 * so nothing about the shape changes and the caller keeps the type it passed
 * in. It was `(val: any): any`, which is how the aggregate portfolio hook came
 * to declare all eight of its sections `any[]` (#68).
 *
 * The three `as T` are sound for every response shape and unsound for a string
 * literal type: `cleanNullStr("null")` is declared `"null"` and returns `""`.
 * No caller passes a literal — they all pass a response — and narrowing the
 * signature to exclude one would cost more than the case is worth.
 */
export const cleanNullStr = <T>(val: T): T => {
  if (val === "null" || val === "undefined") return "" as T;
  if (Array.isArray(val)) return val.map(cleanNullStr) as T;
  if (val !== null && typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, cleanNullStr(v)]),
    ) as T;
  }
  return val;
};
