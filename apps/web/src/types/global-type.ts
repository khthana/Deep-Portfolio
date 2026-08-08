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
