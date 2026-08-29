#!/usr/bin/env bash
set -euo pipefail

# PMエージェント: 要件整理の簡易ハーネス
# 入力: OPTIONAL ISSUE_FILE 環境変数で課題テキストを与えられる
# 出力: ./artifacts/requirements.txt

mkdir -p artifacts
ISSUE_FILE=${ISSUE_FILE:-.github/ISSUE.md}

if [ -f "$ISSUE_FILE" ]; then
  echo "読み込んだ課題: $ISSUE_FILE"
  sed -n '1,200p' "$ISSUE_FILE" > artifacts/requirements.txt
else
  echo "# 要件（デフォルト）" > artifacts/requirements.txt
  echo "- 目的: CIでPM->Dev->Reviewのループを実現" >> artifacts/requirements.txt
  echo "- 成功条件: テストが通るまで自動修正を試行する" >> artifacts/requirements.txt
fi

echo "PMエージェント: 要件を artifacts/requirements.txt に出力しました"
