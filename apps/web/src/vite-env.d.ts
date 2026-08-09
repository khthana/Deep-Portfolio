/// <reference types="vite/client" />

/**
 * The variables this app expects on `import.meta.env`.
 *
 * Vite's own declaration carries an index signature, so any name at all still
 * type-checks — including one that is misspelt or was never defined. Naming
 * them here is what makes the two the app actually reads appear on the type,
 * and it is the declaration `src/configs/env.ts` is written against. Read them
 * from there rather than from here: this says what the build substitutes, and
 * that says whether it substituted anything.
 */
interface ImportMetaEnv {
  /** Base URL of the API. See apps/web/.env.example. */
  readonly VITE_BACKEND_URL: string;
  /** Google OAuth client id the login page asks for an ID token with. */
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
