#!/bin/bash

INPUT=$(cat)

# Pull the command out of the PreToolUse payload. jq is not installed on every
# machine this repo is worked on, so fall back to node (always present — this
# is a Node project) and, if neither is there, scan the raw payload rather than
# letting the request through unchecked. A guardrail that fails open is worse
# than no guardrail, because it looks like it is working.
if command -v jq >/dev/null 2>&1; then
  COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
elif command -v node >/dev/null 2>&1; then
  COMMAND=$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const c=JSON.parse(s);process.stdout.write(String(c&&c.tool_input&&c.tool_input.command||""))}catch(e){process.stdout.write(s)}})')
else
  COMMAND=$INPUT
fi

# A plain `git push` is deliberately absent: publishing each finished ticket is
# part of how this repo is worked. What is blocked is the push that rewrites
# what is already published, in either spelling — including --force-with-lease,
# which the substring covers. The " -f" pattern requires the flag to stand
# alone so a branch named feature-x does not look like one.
DANGEROUS_PATTERNS=(
  "push --force"
  "push( .*)? -f( |$)"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
