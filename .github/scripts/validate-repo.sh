#!/usr/bin/env bash
set -euo pipefail

echo "Validating repository harness for App Service project..."

required_dirs=(
  ".github/workflows"
  ".github/scripts"
  ".github/templates"
  ".github/docs"
  "app-service"
  "app-service/src"
  "app-service/config"
  "app-service/tests"
  "infra"
  "infra/bicep"
  "infra/bicep/env/dev"
  "docs"
  "docs/architecture"
  "docs/runbooks"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "Missing required directory: $dir"
    exit 1
  fi
done

required_files=(
  "README.md"
  ".gitignore"
  ".editorconfig"
  "Makefile"
  ".github/workflows/ci.yml"
  ".github/workflows/deploy-dev.yml"
  ".github/workflows/deploy-prod.yml"
  ".github/scripts/lint.sh"
  ".github/scripts/azure-check.sh"
  ".github/templates/pull_request_template.md"
  ".github/templates/issue_template.md"
  ".github/docs/harness-guide.md"
  "app-service/README.md"
  "infra/README.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

echo "Repository harness structure is valid."
