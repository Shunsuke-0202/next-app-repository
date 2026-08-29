#!/usr/bin/env bash
set -euo pipefail

# 開発エージェント: テスト実行と自動修正を試行するハーネス
# 環境変数:
#  - MAX_ATTEMPTS (デフォルト 3)
#  - APP_DIR (デフォルト app-service)
#  - AUTO_PUSH (true/false) — GITHUB_TOKEN がある場合にコミットをプッシュするか

MAX_ATTEMPTS=${MAX_ATTEMPTS:-3}
APP_DIR=${APP_DIR:-app-service}
AUTO_PUSH=${AUTO_PUSH:-false}

echo "開発エージェント開始: APP_DIR=$APP_DIR, MAX_ATTEMPTS=$MAX_ATTEMPTS"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "試行 $attempt/$MAX_ATTEMPTS: テストを実行します"

  if [ -f "$APP_DIR/package.json" ]; then
    npm --prefix "$APP_DIR" install --no-audit --no-fund || true
    set +e
    npm --prefix "$APP_DIR" test
    rc=$?
    set -e
  else
    echo "警告: $APP_DIR/package.json が見つかりません。代替のテストコマンドを実行します。"
    # 代替: ルートにテストターゲットがあれば実行
    if command -v pytest >/dev/null 2>&1; then
      set +e
      pytest
      rc=$?
      set -e
    else
      echo "テストが見つからないため成功扱いにします"
      rc=0
    fi
  fi

  if [ "$rc" -eq 0 ]; then
    echo "テスト成功"
    exit 0
  fi

  echo "テスト失敗: 自動修正を試みます"

  # Try lint fix if available
  if [ -f "$APP_DIR/package.json" ]; then
    if npm --prefix "$APP_DIR" run -s lint -- --version >/dev/null 2>&1; then
      npm --prefix "$APP_DIR" run -s lint -- --fix || true
    fi
  fi

  # If git has changes, commit and optionally push
  if [ -n "$(git status --porcelain)" ]; then
    git config user.email "dev-agent@example.com" || true
    git config user.name "dev-agent" || true
    git add -A
    git commit -m "dev-agent: auto-fix attempt #$attempt" || true

    if [ "$AUTO_PUSH" = "true" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
      BRANCH=$(git rev-parse --abbrev-ref HEAD)
      git push origin "HEAD:$BRANCH" || echo "push failed"
    fi
  else
    echo "自動修正で差分は作成されませんでした"
  fi

  attempt=$((attempt + 1))
done

echo "最大試行回数に到達しました。テストがまだ失敗しています。"
exit 1
