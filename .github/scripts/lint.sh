#!/usr/bin/env bash
set -euo pipefail

echo "Running basic repository lint checks..."

if command -v shellcheck >/dev/null 2>&1; then
  shellcheck .github/scripts/*.sh
else
  echo "shellcheck not installed; skipping shell lint"
fi

find . -name '*.sh' -print

echo "Lint checks completed."
