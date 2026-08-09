/**
 * Whether a value means true.
 *
 * It takes `unknown` because it is called on things nobody has checked yet —
 * anything that is not the boolean `true` or the four letters t-r-u-e is false,
 * and a narrower parameter type would only push the cast to the call site.
 */
export const parseBool = (val: unknown) => val === "true" || val === true;
