export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
};

export function successResponse<T>(
  res: any,
  data: T,
  message = "Success",
  status = 200
) {
  res.status(status).json({
    success: true,
    message,
    data,
  } as ApiResponse<T>);
}
