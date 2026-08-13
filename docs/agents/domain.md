# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One `CONTEXT.md` and one `docs/adr/` at the repo root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

`CONTEXT.md` does not exist yet in this repo. `docs/adr/` does, and holds the
decisions taken after the refactor. Eleven of them are about who may act on
what: `0001-portfolio-access.md` (a student's own rows),
`0002-section-access.md` (a teacher's own sections),
`0003-enrolment-access.md` (a student's own sections),
`0004-group-leader.md` (a group's own leader),
`0006-file-access.md` (whoever may read the row an attachment hangs on, via a
short-lived signed URL), `0007-group-membership.md` (a new group is the
caller's own, and everyone in it is in the class),
`0009-submission-ownership.md` (the work you hand in is your own, or your
group's), `0011-self-read-parameter.md` (where the "which person" parameter
of a self-read comes from — the session, or the request with an ownership
check), `0013-student-read-access.md` (the last three reads in `/student`,
each of which took the rule of its neighbours rather than one rule for all
three) and `0014-shared-rubric-access.md` (the programme's shared rubrics
belong to any teacher, and why the rule is not narrowed to the caller's own
programme) and `0020-mapping-names-own-submission.md` (an id that arrives in a
`POST` body and names a row with an owner: ask before writing, `400` when the
row is not there and `403` when it belongs to someone else). Read all eleven
before adding an authorisation check anywhere. Twelve
more are about when or what rather than who: `0005-announcement-date.md` — a
piece of work with no announcement date counts as announced, on every
student-facing read — `0008-attachment-lifecycle.md`, which says an attachment
dies with its last owner, so read it before writing any endpoint that deletes
a row an attachment hangs on, and its counterpart
`0016-attachment-upload-rollback.md`, which says an upload is taken back out of
the bucket when the transaction around it does not commit, so read that one
before writing an endpoint that creates one, `0010-rubric-level-identity.md`,
which says a rubric level is identified by its `id`, never by its position in
the row, `0012-missing-row-status.md`, which says a row the caller addressed but
which is not there answers 404 rather than 500, and draws the line between
that and a value in the body that names nothing,
`0015-unmappable-activity.md`, which applies that line to
`POST /mapping/activity` and separates the three reasons an activity cannot
yet be tied to a CLO — read it before making a service reject a row for being
incomplete rather than absent — and
`0017-group-membership-means-accepted.md`, which says a member who has not
accepted the invitation is not in the group anywhere that decides who gets
what, so read it before asking a group who its members are, and
`0018-absent-flag-means-column-default.md`, which says an optional flag a
`POST` leaves out is not written at all, so the column's `@default` answers —
read it before writing `?? true` into a service — and
`0019-group-list-is-member-lists.md`, which says
`GET /student-activity-group/all` lists the member lists a student has worked
in rather than the groups themselves, so read it before treating its
de-duplication as a bug, and `0021-section-without-teacher.md`, which says a
section nobody has been assigned to teach is still shown, with the five
teacher fields answering `null` together — hiding takes an instruction, and
nobody gave one — and `0022-api-sentence-reaches-the-screen.md`, which puts the
API's Thai sentence on `error.message` at the axios interceptor rather than in
each thunk, so read it before writing another fallback sentence into a screen,
and `0023-unaccepted-members-have-their-own-field.md`, which says a member who
has not accepted is reported in a field of its own rather than mixed into
`members`, so read it alongside ADR-0017 before changing what a teacher-facing
endpoint says about a group, and
`0024-unsubmitted-work-shares-the-roster.md`, which says a teacher's marking
table is the roster of everyone the work was set for rather than the list of
who handed it in, so read it before adding a `status` filter to anything that
answers a teacher.
Everything the refactor itself decided is in `docs/spec-refactor-redeploy.md`,
whose Implementation Decisions (D1–D13) and Testing Decisions (T1–T7) sections
function as ADRs for that period. Treat a contradiction with either the same
way: surface it, don't override it silently.

## File structure

Single-context repo (most repos):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

Note: this repo uses an npm-workspaces layout (`apps/api`, `apps/web`, and an
empty `packages/`). That is a package boundary, not a bounded-context
boundary — it does not on its own justify switching to multi-context. Revisit
only if `packages/` grows genuinely separate domains.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

This domain carries a lot of Thai higher-education vocabulary (CLO, PLO,
rubric levels, score weights, semester courses, sections). The database uses
one set of names and the thesis document another; where they disagree,
`prisma/schema.prisma` is the source of truth, per spec D2.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
