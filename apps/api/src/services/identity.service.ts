import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

/**
 * Where "who is this?" is answered by somebody other than us.
 *
 * This is the one seam in the application that a test is allowed to replace
 * (D3). Everything else in the suite runs against the real thing — real
 * Postgres, real object storage, real middleware — because a stub proves the
 * code works for a request the real component would have refused. Google is
 * the exception for a reason that will not go away: signing a valid ID token
 * needs Google's private key, so a test can either reach across the network to
 * an identity provider it does not control, or swap the provider out. It swaps
 * the provider out.
 *
 * The seam is deliberately narrow. It is one method that turns an opaque token
 * into an email address; deciding whether that address may log in belongs to
 * AuthService, against the real database, and is not mocked anywhere.
 */

/** What the provider was able to prove about the person holding the token. */
export interface VerifiedIdentity {
  /** The address the provider says it verified, lower-cased. This is the only
   *  field the login flow uses — it is the key into `users.email`. */
  email: string;
  /** The provider's own stable id for the account (`sub` in the token). Not
   *  stored anywhere yet. It is here because it, not the address, is what an
   *  account-linking table would key on if one is ever needed: a person can
   *  change their email address without becoming a different person. */
  subject: string;
  /** Display name, when the provider sends one. Never trusted for anything —
   *  names shown in this application come from `users`. */
  name?: string;
}

export interface IdentityProvider {
  /**
   * Resolves to who the token is for, or to null for anything that is not a
   * currently valid token issued to this application for a verified address.
   *
   * Null rather than a thrown error on purpose: a bad token is an ordinary
   * outcome of a login attempt, not an exceptional one, and the caller has a
   * single sensible response to every flavour of bad.
   */
  verifyIdToken(idToken: string): Promise<VerifiedIdentity | null>;
}

export class GoogleIdentityProvider implements IdentityProvider {
  private readonly client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity | null> {
    let payload;

    try {
      // audience is the whole point of the call: without it this verifies only
      // that Google signed the token, not that Google signed it for us.
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch {
      // Expired, malformed, signed by something else, or issued for another
      // client. All of them mean the same thing to the caller.
      return null;
    }

    if (!payload?.email) {
      return null;
    }

    // An unverified address is one the account holder typed, not one Google
    // checked. Accepting it would let anyone log in as anyone by claiming
    // their address.
    if (payload.email_verified !== true) {
      return null;
    }

    return {
      email: payload.email.toLowerCase(),
      subject: payload.sub,
      name: payload.name,
    };
  }
}

let override: IdentityProvider | null = null;
let google: GoogleIdentityProvider | undefined;

/**
 * The provider the login flow should use.
 *
 * Resolved per call rather than captured at import, so that a test can install
 * its own before the first request without having to control module load
 * order. The real one is built once, on first use — constructing it reads
 * GOOGLE_CLIENT_ID, and a test that never logs in should not need one.
 */
export function identityProvider(): IdentityProvider {
  if (override) {
    return override;
  }

  google ??= new GoogleIdentityProvider();
  return google;
}

/** Installs a stand-in provider; pass null to go back to Google. Test-only. */
export function setIdentityProvider(provider: IdentityProvider | null): void {
  override = provider;
}
