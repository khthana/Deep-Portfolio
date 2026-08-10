# DEEP Portfolio

An outcome-based education platform (CLO/PLO, rubrics, gradebook, student
e-Portfolio) handed over as a student capstone project and currently being
re-deployed and refactored.

The plan of record is [`docs/spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md),
tracked as [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1).
Read the spec before proposing structural changes — most of the obvious
questions are already answered there, including what is deliberately out of
scope.

## Current state

Restructuring is done and the system stands on its own; what is left is
mostly correctness work on top of it.

- **Monorepo**: npm workspaces — `apps/api` (Express 5 + Prisma + PostgreSQL),
  `apps/web` (React 19 + Vite + Ant Design), `packages/` empty and reserved.
  One lockfile at the root; never run `npm install` in a subfolder.
- **Runs locally in one command**: `docker compose up --build` brings up web,
  API, PostgreSQL and MinIO, and applies migrations on the way. Nothing is
  deployed to a server yet, and there is no CI.
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
- **Tests**: `npm test` at the root runs both workspaces. 781 API cases over
  39 files, 400 web cases over 24 files. Both were written against the
  behaviour that was already there — see the testing rules below.

Open work is in the issue tracker: the README rewrite (#24) and the defects
filed while testing (#25–#31, #33–#35). Everything else from the breakdown of
#1 is closed, #20–#23 included.

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

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, but neither `CONTEXT.md` nor `docs/adr/` exists yet — the
spec's D1–D13 and T1–T7 sections stand in for ADRs meanwhile. See
`docs/agents/domain.md`.
