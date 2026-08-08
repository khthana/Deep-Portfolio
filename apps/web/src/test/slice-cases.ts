import { expect, it } from "vitest";
import type { Reducer, UnknownAction } from "@reduxjs/toolkit";

/**
 * Shared arrangement for the slice reducer tests.
 *
 * Every slice in this app is built the same way — one boolean per request,
 * raised on `pending` and lowered on both `fulfilled` and `rejected`, plus a
 * single `error` string that the rejected handler fills in. Most thunks do
 * nothing else, and writing the same three cases out seventy-nine times would
 * bury the handful of thunks that genuinely put something in state.
 *
 * So the uniform part lives here as a table, and each slice's own file spells
 * out by hand the reducers that copy data out of a response.
 *
 * The actions are built from the thunk's own `typePrefix`, never from a
 * literal type string: a renamed thunk keeps reaching its reducer, and a
 * deleted one stops compiling. Only the response envelope is hand-written —
 * going through `thunk.fulfilled(...)` would mean satisfying each thunk's full
 * response type at every call site, and these cases are about the two or three
 * fields the reducer copies out of it.
 */

/** Redux Toolkit puts one of these on every `createAsyncThunk`. Typed
 *  structurally so the table can hold thunks with unrelated argument and
 *  response types side by side. */
export type ThunkActions = { typePrefix: string };

/** What a failed request says, when the case is not about the message. */
const FAILURE_MESSAGE = "โหลดข้อมูลไม่สำเร็จ";

/** The state a slice starts from, asked for the way the store asks: an action
 *  no reducer of ours handles, so what comes back is the declared initial
 *  state and not the result of anything. */
export const initialStateOf = <S>(reducer: Reducer<S>): S =>
  reducer(undefined, { type: "@@test/init" });

/** The request is in flight. */
export const started = (thunk: ThunkActions): UnknownAction => ({
  type: `${thunk.typePrefix}/pending`,
});

/** The request came back with a body. `data` is the payload's only field the
 *  reducers read — the rest of `ResponseWrapper` never reaches state. */
export const responded = (
  thunk: ThunkActions,
  data: unknown,
): UnknownAction => ({
  type: `${thunk.typePrefix}/fulfilled`,
  payload: { data },
});

/** The request failed. `error` is the shape `miniSerializeError` produces. */
export const failed = (
  thunk: ThunkActions,
  message: string = FAILURE_MESSAGE,
): UnknownAction => ({
  type: `${thunk.typePrefix}/rejected`,
  error: { message },
});

/**
 * A thunk whose only mark on state is its own loading flag.
 *
 * `flag` is checked against the state type, so a renamed field fails the
 * typecheck rather than quietly testing nothing.
 */
export type LoadingOnlyCase<S> = {
  thunk: ThunkActions;
  flag: keyof S & string;
};

/**
 * Four cases per thunk: the flag goes up, the flag comes down, a failure is
 * recorded, and a failure with no message of its own gets the generic one.
 * Each asserts the *whole* state, so a handler that also touched something
 * else would fail here rather than pass unnoticed.
 */
export const itOnlyTracksLoading = <S extends { error: string | null }>(
  reducer: Reducer<S>,
  cases: LoadingOnlyCase<S>[],
) => {
  for (const { thunk, flag } of cases) {
    const initial = initialStateOf(reducer);

    it(`${thunk.typePrefix} raises ${flag} while it is in flight`, () => {
      const pending = reducer(initial, started(thunk));

      expect(pending).toEqual({ ...initial, [flag]: true });
    });

    it(`${thunk.typePrefix} lowers ${flag} once the response arrives`, () => {
      const pending = reducer(initial, started(thunk));

      const fulfilled = reducer(pending, responded(thunk, null));

      expect(fulfilled).toEqual(initial);
    });

    it(`${thunk.typePrefix} lowers ${flag} and records why it failed`, () => {
      const pending = reducer(initial, started(thunk));

      const rejected = reducer(pending, failed(thunk));

      expect(rejected).toEqual({ ...initial, error: FAILURE_MESSAGE });
    });

    it(`${thunk.typePrefix} records a generic message for a failure with none`, () => {
      // Unreachable through `thunk.rejected(...)`, which substitutes "Rejected"
      // for a missing error — but the fallback is in every slice and this is
      // the shape that reaches it.
      const rejected = reducer(initial, {
        type: `${thunk.typePrefix}/rejected`,
        error: {},
      });

      expect(rejected.error).toBe("Something went wrong");
    });
  }
};

/**
 * A thunk that tracks its loading flag and copies the response body into one
 * field, which is the other shape most of these slices are made of.
 */
export type StoresResponseCase<S> = {
  thunk: ThunkActions;
  flag: keyof S & string;
  /** The field the fulfilled handler copies `payload.data` into. */
  field: keyof S & string;
  /** A response body of the kind that field holds. */
  data: unknown;
};

/**
 * Three cases per thunk: the flag goes up, the body lands in its field, and a
 * failure leaves the field as it was. As above, each asserts the whole state,
 * so a handler writing somewhere it should not fails here.
 */
export const itStoresTheResponse = <S extends { error: string | null }>(
  reducer: Reducer<S>,
  cases: StoresResponseCase<S>[],
) => {
  for (const { thunk, flag, field, data } of cases) {
    const initial = initialStateOf(reducer);

    it(`${thunk.typePrefix} raises ${flag} while it is in flight`, () => {
      const pending = reducer(initial, started(thunk));

      expect(pending).toEqual({ ...initial, [flag]: true });
    });

    it(`${thunk.typePrefix} puts the response in ${field}`, () => {
      const pending = reducer(initial, started(thunk));

      const fulfilled = reducer(pending, responded(thunk, data));

      expect(fulfilled).toEqual({ ...initial, [field]: data });
    });

    it(`${thunk.typePrefix} lowers ${flag} and keeps ${field} on failure`, () => {
      const loaded = reducer(initial, responded(thunk, data));

      const rejected = reducer(reducer(loaded, started(thunk)), failed(thunk));

      expect(rejected).toEqual({
        ...initial,
        [field]: data,
        error: FAILURE_MESSAGE,
      });
    });
  }
};
