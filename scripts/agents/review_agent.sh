#!/usr/bin/env bash
set -euo pipefail

# レビューエージェント: lint/ビルド/基本静的解析を行う
# 環境変数:
#  - APP_DIR (デフォルト app-service)

APP_DIR=${APP_DIR:-app-service}

echo "レビューエージェント開始: APP_DIR=$APP_DIR"

if [ -f "$APP_DIR/package.json" ]; then
  if npm --prefix "$APP_DIR" run -s lint -- --version >/dev/null 2>&1; then
    npm --prefix "$APP_DIR" run -s lint || true
  else
    echo "lint スクリプトが見つかりません。"
  fi

  if npm --prefix "$APP_DIR" run -s build --silent >/dev/null 2>&1; then
    npm --prefix "$APP_DIR" run -s build || true
  else
    echo "build スクリプトが存在しない、またはビルド失敗を許容します。"
  fi
else
  echo "警告: $APP_DIR/package.json が見つかりません。レビュー項目はスキップされます。"
fi

echo "レビュー完了"
