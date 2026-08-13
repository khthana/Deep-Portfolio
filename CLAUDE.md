# DEEP Portfolio

An outcome-based education platform (CLO/PLO, rubrics, gradebook, student
e-Portfolio) handed over as a student capstone project and currently being
re-deployed and refactored.

The plan of record is [`docs/spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md),
tracked as [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1),
**which is closed** — the spec was delivered in full on 2026-08-12. It stays
the plan of record for why the system is shaped the way it is. Read it before
proposing structural changes — most of the obvious questions are already
answered there, including what is deliberately out of scope.

## Current state

Restructuring is done and the system stands on its own; what is left is
mostly correctness work on top of it.

- **Monorepo**: npm workspaces — `apps/api` (Express 5 + Prisma + PostgreSQL),
  `apps/web` (React 19 + Vite + Ant Design), `packages/` empty and reserved.
  One lockfile at the root; never run `npm install` in a subfolder.
- **Runs locally in one command**: `docker compose up --build` brings up web,
  API, PostgreSQL and MinIO, and applies migrations on the way. Nothing is
  deployed to a server yet — that half of phase 5 is #65, and it was out of the
  spec's scope on purpose, not skipped.
- **CI runs the same commands you do**: `.github/workflows/ci.yml` runs
  `npm ci`, `npm run typecheck` and `npm test` on every push to `main` and every
  pull request, bringing its services up from `docker-compose.test.yml` — no
  secret is configured on the repo, and nothing in the workflow is a step you
  cannot run yourself. `npm run lint` is not in it yet because it fails today
  (#60); the step lands with the fix. ADR-0026 has the reasoning.
- **Auth is Google sign-in**, not the DEEP Core SSO cookie the hand-over
  assumed. There is no connection back to DEEP Core at all.
- **The database is standalone** — 72 tables from one baseline migration.
  `apps/api/prisma/schema.prisma` is the source of truth for the schema,
  including where it disagrees with the thesis document.
- **Master data goes in through a CLI**, not the UI — 28 tables have no write
  path anywhere in the API. `npm run import --workspace @deep-portfolio/api --
  <absolute path>` reads a directory of CSV files — absolute because
  `--workspace` moves the working directory to `apps/api`; see
  [`docs/importer.md`](docs/importer.md) and `apps/api/src/importer/`.
- **Tests**: `npm test` at the root runs both workspaces. 1052 API cases over
  40 files, 450 web cases over 31 files. Both were written against the
  behaviour that was already there — see the testing rules below.

The whole breakdown of #1 is done, #20–#42 included. On top of that came
**#43–#50**, the eight defects that survived an audit of the pinned list in
[`BEHAVIOR-CHANGES.md`](BEHAVIOR-CHANGES.md) on 2026-08-11 — every entry under
"สิ่งที่ **ไม่ได้** เปลี่ยน" was checked against the code, the ones already
closed were marked so, and what genuinely remained got an issue. **All eight
are closed**, and so are all three they spun off: **#52**, where a failed
submission left its upload in MinIO; **#51**, where the API's Thai
sentences did not survive the frontend's thunks — the axios response
interceptor now writes the sentence from the body onto `error.message` and
erases what axios wrote when there is none, so a screen's own Thai fallback
gets its turn (ADR-0022 has that reasoning and the two options it rules out);
and **#53**, where no teacher-facing endpoint showed a group member who never
answered the invitation. Both `submitted/list` endpoints now carry
`group.unaccepted_members` beside `group.members`, each row saying `PENDING`
or `REJECTED`; `members` still means who the score lands on. ADR-0023 has that
reasoning.

**#54 was the frontend following it, and is closed too.** Both teacher marking
tables now carry a "ยังไม่ตอบรับ" column of their own, worded by
`apps/web/src/utils/format-unaccepted-member.ts`, so that the two columns
naming who is being marked read the same as they always did — those two come
from `format-marked-students.ts`, which both pages share.

Nothing from that line of work is open. Read the pinned list in
`BEHAVIOR-CHANGES.md` before starting anything: entries with neither "ปิดแล้ว"
nor an issue number are deliberate, not outstanding.

Everything the spec still owed now has a ticket of its own, **#55–#63**, filed
on 2026-08-12 so that #1 could close on a delivered spec rather than an open
list. Four are defects or gaps in what runs today: **#55** `/auth/refresh`
mints a token for a user who no longer exists (a caller sees `200` and then
`401` on the next call — every guarded route re-reads `users`, so nothing opens
that shouldn't); **#56** groups still holding `NOT_SUBMITTED` never appear to
the teacher at all, so their unanswered invitations do not either; **#57** an
invitation cannot be sent again once its seven days run out, and editing the
group carries the old token over rather than issuing a new one; **#60**
`npm run lint` fails today, `apps/api` has no `lint` script, and no formatter
is configured anywhere. The other five are the work the spec put out of scope
on purpose: **#58** the two empty enums, **#59** phase 5 — a real server and
CI/CD, **#61** the shared types package `packages/` is reserved for, **#62**
component and E2E tests, **#63** the `any` sweep and the long files.

#1 closed with them filed, so the open list is #55–#63 plus whatever they spin
off — nothing else is outstanding anywhere. **#64** is the first of those: #56
put a row on the teacher's marking table for a student who is in no group at
all, and the only link that row offers leads to a grading page that cannot
mark it. Whether such a student should be markable is a course decision, not a
code one, so #56 made the refusal legible (`400` with a Thai sentence, where a
bare `Error` used to reach the caller as `500`) and left the question to #64.
**#65** is the second: #59 said itself that its CI half could be done without
knowing anything about a server and its CD half could not, so the CI half was
done and #59 closed on it, and #65 carries the five decisions CD still waits on.

**The database has real data in it.** One faculty, 14 departments, 3
programmes, 65 subjects and 18 teachers went in through the importer on
2026-08-09. The CSV files are in `data/`, which is gitignored because they
hold real people — never commit them, and never quote a name or an address
out of them into a commit message, an issue or a test.

[`docs/tc-traceability.md`](docs/tc-traceability.md) maps all 75 manual test
cases from the thesis onto the automated tests that cover them — read it before
claiming a behaviour is or is not under test.

## Language convention

- **Code, tests, commit messages, and agent-facing docs**: English.
- **Explanatory documentation** (`README.md`, `BEHAVIOR-CHANGES.md`,
  `docs/*.md`, and issue bodies and comments): Thai.
- **Error messages shown to end users**: Thai — the frontend renders them directly.

## Testing

Both seams named in T2 of the spec are in place. Add to them; don't invent a
third one.

- **API — the HTTP edge.** `apps/api/test/*.test.ts` fire requests at the
  imported Express app with supertest, against a real PostgreSQL and a real
  MinIO in containers. Assert status, response body and database state only —
  never which service or query ran (T1). Every endpoint gets at least one
  success and one failure case (T5). Data comes from the factories in
  `apps/api/test/factories/`; pass only the fields the case is about.
- **Web — pure functions.** Tests sit beside the file they cover. No DOM, no
  module mocking, no component renders — component and E2E tests are
  deliberately out of scope. `apps/web/src/test/slice-cases.ts` holds the
  table the slice reducer tests share.
- **Dates**: no case may assume the machine's timezone. The suites pin
  `TZ=UTC` so failures read the same everywhere, but cases are written to
  pass without it.
- **Verified state, not remembered state**: run `npm test` at the root before
  saying a change is green, and `npm run typecheck` alongside it.

## Behaviour changes

Per D9, a defect found while writing tests is fixed on the spot and the test
is written to the correct behaviour — not pinned to the wrong one. Anything
that changes what a caller sees goes in
[`BEHAVIOR-CHANGES.md`](BEHAVIOR-CHANGES.md), in Thai, with what it did
before, what it does now, why, and which frontend callers need to follow.

When a defect cannot be fixed inside the current ticket — because the fix
spans the whole system, or the decision belongs to someone else — pin it with
a test that documents it, say so in the test, and record it in the same file
under the "pinned" list.

## Prose carries claims, and claims get checked

This repo argues in prose — Thai ADRs, `BEHAVIOR-CHANGES.md`, long comments
above services and tests. Every sentence that says what the code does, cites
another ADR, names a frontend caller, or counts anything is a claim, and no
test will catch it when it is wrong. Open the source and confirm it before you
commit it; a wrong comment outlives the wrong code, because the next reader
believes it.

Two failure modes worth naming, both of which have happened here:

- **Citing an ADR for a rule it does not contain.** If the decision you need
  is not actually in the ADR you were about to point at, the new ADR owns the
  decision itself and says why the older rule does not reach it.
- **Trusting an issue's own acceptance criteria.** They are written before the
  code is read and can be factually wrong. When one is, correct the issue —
  don't implement to it and don't repeat it in the ADR.

Issue state is a claim too: don't write "#N is closed" anywhere until it is.
Put `Closes #N` in the commit message and let the push do it.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. `CONTEXT.md` does not exist yet, and the spec's D1–D13 and
T1–T7 sections stand in for ADRs on everything the refactor decided.
`docs/adr/` holds decisions taken since, one file each. See
`docs/agents/domain.md`.
