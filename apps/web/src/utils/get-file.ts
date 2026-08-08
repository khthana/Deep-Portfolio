const backendEndpoint = import.meta.env.VITE_BACKEND_URL;
const isProduction = import.meta.env.NODE_ENV === "production";

export const getFile = (src: string) => {
  return `${isProduction ? "/" : `${backendEndpoint}/`}files?path=${src}`;
};
