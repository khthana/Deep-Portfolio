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
before adding an authorisation check anywhere. Eighteen
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
answers a teacher, and `0025-invitation-can-be-issued-again.md`, which says
inviting a member again is an endpoint of its own rather than a side effect of
editing the group, and that it reaches only a member who has not answered yet,
so read it before making a write mint or copy an invite token, and
`0026-ci-runs-what-a-developer-runs.md`, which says the CI workflow calls the
repo's own npm scripts and brings its services up from
`docker-compose.test.yml`, so read it before adding a check to `.github/` that
a developer cannot run the same way, and its follow-up
`0027-lint-and-format.md`, which says every workspace lints under its own flat
config, Prettier runs from the root with its defaults over everything but
`*.md`, CI fails on an ESLint error and never on a count of warnings, and no
git hook runs any of it — read it before adding a rule, a formatter option or a
`--max-warnings` anywhere, and `0028-shared-api-types.md`, which says the shape
of a response is declared once in `@deep-portfolio/api-types`, written by hand
to what the JSON actually carries rather than to what Prisma holds, and
imported by the API as well as the web — read it before writing a type that
mirrors a response, or before putting a `Date` in one, and its follow-up
`0029-api-types-per-feature.md`, which answers the five questions the second
feature's move ran into and the first one did not: names in the package carry
the feature, a type used across features lives in its own feature's file, an
emptied model file is deleted rather than left re-exporting, a feature that
has not moved yet but borrows a moved shape is corrected in the same pass, and
a shared web helper is widened rather than narrowed — read it before starting
another pass of #68, and `0030-evaluation-row-union.md`, which says a response
holding more than one shape of row is written as a union discriminated on the
field that already tells them apart, not as one row with every difference
marked optional, and that a row borrowed whole from another feature is
intersected with that feature's type rather than copied field by field, and
`0031-attachments-are-the-leaf.md`, which says the order of the remaining
passes is set by the dependency graph rather than by size — a shape several
features embed moves before all of them, and a file mixing a runtime value
with its types is split rather than moved whole, because the package compiles
to nothing on purpose, and `0032-activity-follows-the-row.md`, which says a
response built by spreading a Prisma row is written from a test that names
every key rather than from the type that was there — an `as` over the whole
object hides the shape of every field at once — that one nested shape read two
ways is two types, and that an unconstrained `json` column is `unknown` on the
wire, because a recursive JSON union breaks Immer's draft recursion where the
value is held in a slice, and
`0033-learning-activity-and-the-absent-key.md`, which says a key JSON drops
because its value is `undefined` is not the same thing to a caller as a key
sent as `null`, so it is written optional rather than nullable and pinned with
`not.toHaveProperty`, and that two columns holding the same two values on two
tables stay two unions, each guarded by its own schema, and
`0034-submissions-move-as-a-pair.md`, which says two features that share a
shape outright move in one pass rather than one dragging the other along
behind it, that a row carrying two mutually exclusive halves is a union on the
discriminant it already has, and that where the type can only be written
honestly by admitting a shape nobody designed, the shape is what gets fixed,
and `0035-one-group-shape-for-both-halves.md`, which says two endpoints
answering the same shape field for field get one declaration rather than a
twin named after each route, that names in the package say what a shape is
rather than which read fetched it, and that a pass covers a feature's writes as
well as its reads — the scope is what the API answers, not which method asked,
and `0036-a-bare-scalar-gets-no-name.md`, which says a response that is a bare
number or string gets no type of its own: a name is worth writing only when it
tells a reader something the value does not, and
`0037-the-package-says-what-the-wire-says.md`, which says an enum in the shared
package is spelled the way it leaves the API rather than normalised — where two
endpoints disagree on casing, the package records the disagreement instead of
hiding it, and `0038-a-factory-must-be-able-to-say-null.md`, which says a test
factory has to be able to express a nullable column as null: an option written
`options.x ?? default` collapses "not given" and "given as null" into one, and
the case that proves the type cannot then be written at all, and
`0039-the-row-and-what-is-added-to-it.md`, which says endpoints answering the
same row with something added or nothing added get one type for the row and
intersections over it, rather than the columns written out once per endpoint —
the other half of 0030's question, which covered rows that genuinely differ,
and `0040-the-portfolio-is-ten-features.md`, which says a name shared by ten
routers is a URL prefix rather than one feature, so the e-Portfolio walks as
several passes with the aggregate read last, and that a shape belonging to one
row is given its own small type rather than forced into the list shape its
neighbours use.
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

Note: this repo uses an npm-workspaces layout (`apps/api`, `apps/web`, and
`packages/api-types`, which holds the shapes the API answers in). That is a
package boundary, not a bounded-context boundary — it does not on its own
justify switching to multi-context. Revisit only if `packages/` grows
genuinely separate domains.

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
