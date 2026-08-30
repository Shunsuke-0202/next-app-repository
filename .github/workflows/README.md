# GitHub Workflows 一覧

このディレクトリには、リポジトリの CI/CD とエージェント運用に関する GitHub Actions 定義を置いています。

## 1. `agents-ci.yml`

- 目的: PM / Dev / Review のエージェントをまとめて実行するメインワークフロー
- トリガー:
  - `push`（`main` / `master` を含むブランチ）
  - `pull_request`
  - `workflow_dispatch`（手動実行）
- 何をしているか:
  - `scripts/agents/pm_agent.sh` を実行して要件を整理
  - `scripts/agents/dev_agent.sh` を実行してテストと修正ループを回す
  - `scripts/agents/review_agent.sh` を実行してレビューを行う
- 使いどころ:
  - 対話型エージェントの標準パイプラインを実行したいとき
  - PR / push 時に自動でレビュー・修正を走らせたいとき

## 2. `agents-dispatch.yml`

- 目的: 外部からの webhook / dispatch を受けてエージェント実行を開始するためのワークフロー
- トリガー:
  - `repository_dispatch`（`event_type: run-agents`）
  - `workflow_dispatch`（手動実行）
- 何をしているか:
  - `scripts/agents/pm_agent.sh` で要件を受け取る
  - `dev_agent.sh` でテスト・修正ループを実行
  - `review_agent.sh` で品質確認を行う
- 使いどころ:
  - 外部チャットや外部からの webhook で依頼を受けて自動起動したいとき

## 3. `issue-trigger.yml`

- 目的: GitHub Issue を起点に PM / Dev / Review を自動起動するためのワークフロー
- トリガー:
  - `issues`（`opened`, `edited`, `reopened`, `labeled`）
  - 実行条件: 対象 Issue に `agent-trigger` ラベルを付けたときのみ
- 何をしているか:
  - Issue 本文を `.github/ISSUE.md` に書き出す
  - `.github/issues/YYYYMMDD_{slug}.md` に日付付き履歴として保存する
  - `pm_agent.sh`, `dev_agent.sh`, `review_agent.sh` を順に実行する
- 使いどころ:
  - GitHub 上で要件を管理したいとき
  - issue を作成して「この issue を自動処理対象にする」運用にしたいとき

## 4. `ci.yml`

- 目的: リポジトリの基本的な整合性チェック
- トリガー:
  - `push`（`main` / `master`）
  - `pull_request`
- 何をしているか:
  - `.github/scripts/validate-repo.sh` を実行してリポジトリ構造を確認
  - `.github/scripts/lint.sh` を実行して静的チェックを行う
- 使いどころ:
  - 変更の最小品質チェックを行いたいとき
  - PR 前の基本検証

## 5. `deploy-dev.yml`

- 目的: 開発環境へのデプロイを実行する placeholder workflow
- トリガー:
  - `workflow_dispatch`（手動実行）
- 何をしているか:
  - Azure 環境確認スクリプトを実行
  - `echo` によるデプロイ処理のプレースホルダーを表示
- 使いどころ:
  - Azure App Service への dev 環境デプロイを後続で実装したいとき

## 6. `deploy-prod.yml`

- 目的: 本番環境デプロイの placeholder workflow
- トリガー:
  - `workflow_dispatch`（手動実行）
- 何をしているか:
  - Azure 環境確認スクリプトを実行
  - 本番デプロイの開始位置を定義
- 使いどころ:
  - production へのデプロイ処理を段階的に実装したいとき

## 7. `prompt-check.yml`

- 目的: システムプロンプト関連ファイルの整合性チェック
- トリガー:
  - `pull_request`
  - 変更対象パス:
    - `.github/system_prompt.txt`
    - `docs/prompting_system_prompt.md`
    - `docs/prompting.md`
    - `docs/runbooks/ai.md`
- 何をしているか:
  - `.github/scripts/check-system-prompt.sh` を実行してプロンプトの規約チェックを行う
- 使いどころ:
  - LLM 用プロンプトや関連ドキュメントが破損していないかを確認したいとき

## 運用メモ

- 基本は `ci.yml` で最小チェック、`agents-ci.yml` でエージェント実行を行う設計
- GitHub Issue を起点にした自動化は `issue-trigger.yml` を利用する
- `workflow_dispatch` を使うと GitHub の UI から手動起動できる
- webhook 連携が必要な場合は `agents-dispatch.yml` を利用する
- 実デプロイコマンドや Azure ログイン処理は後続で追加する
