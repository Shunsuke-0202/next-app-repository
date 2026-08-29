#!/usr/bin/env bash
set -euo pipefail

FILE=".github/system_prompt.txt"
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found"
  exit 2
fi

MAX_CHARS=2000
CHARS=$(wc -c < "$FILE" | tr -d ' ')
if [ "$CHARS" -gt "$MAX_CHARS" ]; then
  echo "ERROR: system prompt too long ($CHARS > $MAX_CHARS)"
  exit 1
fi

# Forbidden patterns (case-insensitive)
if grep -qEi 'api[_-]?key|secret|password|token' "$FILE"; then
  echo "ERROR: Forbidden secret-like pattern found in $FILE"
  grep -nEi 'api[_-]?key|secret|password|token' "$FILE" || true
  exit 1
fi

echo "OK: system prompt checks passed ($CHARS chars)"
