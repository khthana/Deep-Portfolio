# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

Repo: [`khthana/Deep-Portfolio`](https://github.com/khthana/Deep-Portfolio)

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

Note for this repo: bodies are usually written in Thai. Pass them via `--body-file`
rather than `--body`, so PowerShell quoting cannot mangle the encoding. The same
goes for a `--comment` that has to carry Thai or quote marks: bind it to a
single-quoted variable first (`$msg = '...'; gh issue close <n> --comment $msg`),
because PowerShell 5.1 will otherwise split it into several arguments and `gh`
rejects the call.

**Closing is the commit's job, not a follow-up step.** Put `Closes #N` in the
commit message that carries the fix, so pushing closes the issue. `gh issue
close` is for the ones that slipped through, and for issues closed without a
commit. Until the push lands, the issue is open — say so, and don't write
"closed" into `CLAUDE.md` or the list below ahead of the fact.

**An issue spun off while implementing another gets filed before the link to it
is written**, not after. A dangling `#N` in `BEHAVIOR-CHANGES.md` or an ADR is a
broken promise the next reader has no way to chase.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Existing issues worth knowing about

- **#1 — the refactor / re-deploy spec. Closed on 2026-08-12.** Labelled `spec`,
  `ready-for-agent`, `documentation`. Its canonical source is
  `docs/spec-refactor-redeploy.md`; the issue is a copy kept for tracking, and
  the file is still the plan of record even though the issue is closed. If the
  spec is ever amended, edit the file first, then sync the issue — never only
  the issue.
- **#2–#24 — the 23 tickets that break #1 down.** Every one names `#1` as its parent
  and carries `ready-for-agent`. Blocking edges use GitHub's native issue
  dependencies, so the frontier query below is the authoritative "what can I
  pick up next" — don't infer readiness from the issue number.
  **#2–#24 are all closed** — #24 (README) went on 2026-08-10, which is the whole
  breakdown done. #23 (importer) was `needs-info` until the project owner handed
  over the real data on 2026-08-09; that label is gone and the ticket is done.
  #1 itself stayed open as the umbrella until 2026-08-12, when what it still
  owed was refiled as #55–#63.
- Issues #12–#18 (the endpoint test batches) were deliberately chained one after
  another even though they are technically independent. They all edit the same test
  factory files, so running them in parallel would have conflicted. All are closed
  now, so the chain no longer gates anything.
- **#25 and up** are defects found while writing the tests, filed rather than fixed
  because each one needs a decision or reaches past the ticket that found it. They
  are not part of the #1 breakdown and carry no parent. `BEHAVIOR-CHANGES.md`
  records the same findings from the caller's point of view.
  **#25–#42 are closed. #43–#50 were filed on 2026-08-11** after every entry in
  that file's pinned list was checked against the code — half the list had
  already been closed by a later ticket without anyone going back to say so.
  **All eight are now closed too.**
  Each names what has to be decided before it can be picked up, so read the
  issue before assuming the fix is obvious. Three were filed out of those eight
  rather than out of the audit, and all three are closed, as is the one that
  came out of *them*. **#51** came out of
  #43 on the same day — the API's Thai error sentences were dropped by every
  `createAsyncThunk` on the way to the screen. **#52** came out
  of #50 on 2026-08-12 — the four submission paths in `student.service.ts` left
  the uploaded files in MinIO when the transaction rolled their `attachments`
  rows back. **#53** came out of #45 the same day — no teacher-facing endpoint
  reported a group member who never answered the invitation, which matters
  because grading passes over them. **#54** came out of #53 the same day and
  closed on 2026-08-12 — #53 stopped at the API on purpose, so the two teacher
  marking tables were still not showing anyone the API had started sending.

- **#55–#63 were filed on 2026-08-12**, all nine at once, so that #1 could be
  closed against a spec that was delivered rather than one with a list still
  hanging off it. They are not defects found while testing — they are what the
  spec deferred on purpose (`#58` empty enums, `#59` phase 5 — CI and CD, whose
  CI half shipped and whose CD half is now `#65`, `#61` shared
  types, `#62` component and E2E tests, `#63` the `any` sweep) plus four things
  that only had a note in `BEHAVIOR-CHANGES.md` behind them (`#55`
  `/auth/refresh`, `#56` invisible `NOT_SUBMITTED` groups, `#57` no way to
  re-send an invitation, `#60` lint failing with nothing to catch it).
  Most carry `needs-info`: the decision named in the body has to be answered
  before the ticket can be picked up. **#55 and #60 are `ready-for-agent`.**

  A new defect gets a new issue on the same terms: say what has to be decided,
  and record the caller's view of it in `BEHAVIOR-CHANGES.md`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
