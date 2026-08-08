# DEEP Portfolio

An outcome-based education platform (CLO/PLO, rubrics, gradebook, student
e-Portfolio) handed over as a student capstone project and currently being
re-deployed and refactored.

Current state: the original hand-over, restructuring not yet started. The
plan of record is [`docs/spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md),
tracked as [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1).
Read the spec before proposing structural changes — most of the obvious
questions are already answered there, including what is deliberately out of
scope.

## Language convention

- **Code, tests, commit messages, and agent-facing docs**: English.
- **Explanatory documentation** (`docs/*.md`): Thai.
- **Error messages shown to end users**: Thai — the frontend renders them directly.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
