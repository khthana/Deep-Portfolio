import { afterAll } from "vitest";
import {
  IdentityProvider,
  VerifiedIdentity,
  setIdentityProvider,
} from "../../src/services/identity.service";

/**
 * The one component this suite replaces with a stand-in.
 *
 * Everything else runs for real — real Postgres, real object storage, real
 * middleware — but a valid Google ID token can only be signed by Google, so
 * there is no honest way for a test to produce one. What is faked is narrow on
 * purpose: this decides only *whether Google recognises the token and which
 * address it belongs to*. Whether that address may log in is decided by the
 * controller against the real `users` table, and is never faked.
 */

/**
 * A provider that recognises exactly the tokens it was told about.
 *
 * Tokens are opaque strings here — the test picks whatever is readable, e.g.
 * `"token-for-alice"`. Anything not registered comes back as null, which is
 * what the real one does for an expired, tampered-with, or wrong-audience
 * token.
 */
export class FakeIdentityProvider implements IdentityProvider {
  private readonly identities = new Map<string, VerifiedIdentity>();

  /** Registers `token` as belonging to `email`, and returns the token. */
  issue(token: string, email: string, name = "Test User"): string {
    this.identities.set(token, {
      // Lower-cased because the real provider lower-cases: a test must not be
      // able to reach the case-insensitive lookup through a path production
      // cannot produce.
      email: email.toLowerCase(),
      subject: `sub-${token}`,
      name,
    });

    return token;
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity | null> {
    return this.identities.get(idToken) ?? null;
  }
}

/**
 * Installs a fake provider for the calling file and removes it afterwards.
 *
 * The override lives in module scope, so leaving one installed would follow the
 * process into whatever runs next in the same file; the cleanup is registered
 * here rather than left to each test to remember.
 */
export function useFakeIdentityProvider(): FakeIdentityProvider {
  const provider = new FakeIdentityProvider();
  setIdentityProvider(provider);

  afterAll(() => {
    setIdentityProvider(null);
  });

  return provider;
}
