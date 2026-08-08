import { describe } from "vitest";
import { groupSlice } from "./teacher-home-slice";
import { postAcceptInvite, postValidateInvite } from "./teacher-home-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * Accepting an invitation into a group.
 *
 * Both requests are commands: the page reads nothing back out of the store
 * afterwards, it refetches. So the slice is two loading flags and an error,
 * and there is nothing here the table does not cover.
 */

describe("groupSlice", () => {
  itOnlyTracksLoading(groupSlice.reducer, [
    { thunk: postValidateInvite, flag: "postValidateInviteLoading" },
    { thunk: postAcceptInvite, flag: "postAcceptInviteLoading" },
  ]);
});
