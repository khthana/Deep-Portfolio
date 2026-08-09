import { env } from "../configs/env";

/**
 * `NODE_ENV` is not a variable Vite defines — it exposes MODE, DEV and PROD —
 * so this reads undefined in every build and the same-origin branch never runs.
 * Left as it is rather than switched to `import.meta.env.PROD`, because that
 * would start serving files from "/" the moment the app is built for
 * production, and "/files" only resolves behind a reverse proxy that has not
 * been chosen yet. Pinned by a case in get-file.test.ts.
 */
const isProduction = import.meta.env.NODE_ENV === "production";

export const getFile = (src: string) => {
  return `${isProduction ? "/" : `${env.BACKEND_URL}/`}files?path=${src}`;
};
