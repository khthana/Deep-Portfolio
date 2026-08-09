/**
 * Wraps work so that everybody who asks for it while it is already running
 * waits on the one attempt instead of starting another.
 *
 * Written for the token refresh. A page load fires several requests at once,
 * so when an access token expires they all come back 401 together — and all of
 * them want the same thing, one new token. What they must not do is ask for it
 * separately: the API rotates the refresh token on every use, so the second
 * request would be spending a token the first has already replaced.
 *
 * The attempt is not remembered once it settles, success or failure. A refresh
 * can fail because the session is over, but just as easily because the network
 * blinked, and a wrapper that latched would turn the blink into a logout on
 * every request after it.
 */
export function singleFlight<T>(work: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return () => {
    if (inFlight) {
      return inFlight;
    }

    // The `finally` runs before the caller's `then`, so the slot is already
    // free by the time anybody can ask again — a caller retrying the moment
    // its wait resolves starts a new attempt rather than joining the dead one.
    inFlight = work().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
}
