/**
 * The two envelopes every endpoint answers in.
 *
 * `success` is the field a caller branches on, and it is present either way —
 * before #20 a rejection from the auth middleware had no `success` at all while
 * one from the error handler did, so the frontend could not read a response
 * without knowing which layer had produced it.
 */
export type ApiResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiError = {
  success: false;
  message: string;
  /** Present only when the request was refused field by field. */
  errors?: FieldError[];
};

/** Where in the request a rejected field came from. */
export type FieldLocation = "params" | "query" | "body";

/** One rejected field, in the shape it is serialised in. */
export type FieldError = {
  field: string;
  location: FieldLocation;
  message: string;
};
