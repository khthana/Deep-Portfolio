/**
 * The envelope every response arrives in — this copy of it, anyway.
 *
 * The API answers `ApiResponse<T>` and `ApiError` from
 * @deep-portfolio/api-types, and this disagrees with both: `data` is optional
 * there, a field-by-field refusal is `errors: FieldError[]` rather than
 * `error`, and `success` is the literal that tells the two apart rather than a
 * boolean. Moving the 277 readers onto them is #67, which is a ticket of its
 * own because every one of them has to be looked at. See
 * docs/adr/0028-shared-api-types.md.
 */
export type ResponseWrapper<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  error?: any;
};

export type Options = {
  label: string;
  value: string | number;
};
