import { describe, expect, it } from "vitest";
import { singleFlight } from "./single-flight";

/**
 * The sharing rule behind the axios interceptor's token refresh, on its own.
 *
 * Everything the interceptor needs to get right about concurrency is here —
 * how many refreshes a burst of 401s causes, what the callers that did not
 * start one are told, and whether the next burst starts a fresh attempt. The
 * interceptor itself is then just "on 401, await this, retry once", which is
 * the part no test in this suite covers.
 *
 * `deferred()` stands in for the request in flight: nothing resolves until the
 * case says so, so "while one is running" is a state the test can hold still.
 */

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("singleFlight", () => {
  it("runs the work once for callers that arrive while it is in flight", async () => {
    const pending = deferred<string>();
    let calls = 0;

    const refresh = singleFlight(() => {
      calls += 1;
      return pending.promise;
    });

    const waiting = [refresh(), refresh(), refresh()];
    pending.resolve("fresh token");

    expect(await Promise.all(waiting)).toEqual([
      "fresh token",
      "fresh token",
      "fresh token",
    ]);
    expect(calls).toBe(1);
  });

  it("fails every waiting caller when the one attempt fails", async () => {
    // The regression this is really about: the old interceptor rejected the
    // callers that arrived second, so a page that fired four requests at once
    // sent three of them to the login screen while the fourth was still
    // refreshing successfully.
    const pending = deferred<string>();
    const refresh = singleFlight(() => pending.promise);

    const waiting = [refresh(), refresh()];
    pending.reject(new Error("refresh token expired"));

    await expect(waiting[0]).rejects.toThrow("refresh token expired");
    await expect(waiting[1]).rejects.toThrow("refresh token expired");
  });

  it("starts a new attempt once the previous one has settled", async () => {
    let calls = 0;
    const refresh = singleFlight(async () => {
      calls += 1;
      return calls;
    });

    expect(await refresh()).toBe(1);
    expect(await refresh()).toBe(2);
  });

  it("starts a new attempt after a failure rather than failing for ever", async () => {
    // A refresh fails whenever the API is briefly unreachable, not only when
    // the session is really over. Latching on the failure would mean one blip
    // logged the user out of every later request too.
    let calls = 0;
    const refresh = singleFlight(async () => {
      calls += 1;
      if (calls === 1) throw new Error("network down");
      return "fresh token";
    });

    await expect(refresh()).rejects.toThrow("network down");
    expect(await refresh()).toBe("fresh token");
  });

  it("shares one attempt even when the work resolves synchronously", async () => {
    // `async` functions always yield, so callers in the same tick still queue.
    // Stated as a case because the interceptor depends on it: the burst of
    // requests a page fires arrives without an await between them.
    let calls = 0;
    const refresh = singleFlight(async () => {
      calls += 1;
    });

    await Promise.all([refresh(), refresh()]);

    expect(calls).toBe(1);
  });
});
