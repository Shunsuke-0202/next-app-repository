# .github ディレクトリの役割

このディレクトリは、リポジトリの運用・検証・自動化をまとめて管理するための場所です。
実装コードや Azure IaC そのものではなく、「どうやって運用し、どのタイミングで何を実行するか」を定義します。

## 1. 全体像

```text
.github/
├─ ISSUE.md                  # Issue 起点の運用メモ/作業メモ
├─ README_AGENTS.md          # エージェントハーネスの利用ガイド
├─ copilot-instructions.md   # Copilot 向けのプロジェクト指示
├─ docs/
│  └─ harness-guide.md       # 運用方針の要約
├─ issues/
│  └─ 20260830_requirement.md
├─ scripts/
│  ├─ azure-check.sh         # Azure 前提条件チェック
│  ├─ lint.sh                # リポジトリの最低限の静的チェック
│  ├─ validate-repo.sh       # ディレクトリ構造と必須ファイルチェック
│  └─ agents/                # 将来のエージェント処理用スクリプト群（存在時に利用）
├─ templates/
│  ├─ issue_template.md      # Issue テンプレート
│  └─ pull_request_template.md
├─ workflows/
│  ├─ README.md              # Workflow 一覧
│  ├─ ci.yml                 # CI ワークフロー
│  ├─ deploy-dev.yml         # 開発環境デプロイ入口
│  ├─ deploy-prod.yml        # 本番環境デプロイ入口
│  ├─ agents-ci.yml          # エージェント系のまとめ実行
│  ├─ agents-dispatch.yml    # Webhook 経由のエージェント起動
│  └─ issue-trigger.yml      # Issue 起点の自動処理
└─
```

---

## 2. ルート直下のファイル

### ISSUE.md
- 役割: Issue から起動する処理の中間ファイル。
- いつ使うか: `issue-trigger.yml` などで issue 内容を一時的に保存する時。
- 使い方: GitHub Issue の本文をこのファイルに反映させて、後続のエージェント処理に渡す。

### README_AGENTS.md
- 役割: エージェント利用の説明書。
- いつ使うか: リポジトリにエージェント系の自動化を導入したとき、運用者が使い方を確認するとき。
- 使い方: ワークフローやスクリプトが何をするかを確認し、手動実行や webhook 起動を行う。

### copilot-instructions.md
- 役割: GitHub Copilot 向けのプロジェクト固有ルール。
- いつ使うか: AI アシスタントがリポジトリに対して提案や修正を行うとき。
- 使い方: プロジェクト言語、運用方針、秘密情報の扱い、最小修正原則などを明示する。

---

## 3. docs/

### docs/harness-guide.md
- 役割: このリポジトリの運用方針を要約した設計書。
- いつ使うか: 新規参加者が方針を理解したいとき、運用指針を確認したいとき。
- 使い方: App Service 中心の実装、.github 集約運用、CI/CD 分離、シークレット管理の基本方針を参照する。

---

## 4. issues/

### issues/
- 役割: Issue-trigger で出力された履歴ファイルの保管先。
- いつ使うか: GitHub Issue を起点に自動化した記録を残すとき。
- 使い方: 例として `20260830_requirement.md` のような日付付きファイルを作成し、要求内容や対応履歴を残す。

---

## 5. scripts/

### 5.1 azure-check.sh
- 役割: Azure 環境や前提条件の簡易確認。
- いつ使うか: `deploy-dev.yml`、`deploy-prod.yml` の前段で実行する想定。
- 使い方:
  - Azure CLI にログイン済みか確認
  - App Service またはリソースを扱う前の最低限検査を行う
- 現状: placeholder 実装で、今後 `az account show` や `az webapp show` の確認を追加する想定。

### 5.2 lint.sh
- 役割: bash スクリプトの最低限の静的チェック。
- いつ使うか: CI 実行時、PR 作成時、ローカルでの最小検証時。
- 使い方:
  - `shellcheck` が入っていれば実行する
  - `.github/scripts/*.sh` を対象に lint する
- 注意: これはビルド全体の検証ではなく、構文・基本品質の確認用途。

### 5.3 validate-repo.sh
- 役割: リポジトリの構造と必須ファイルを検証する。
- いつ使うか: `ci.yml` 実行時、変更後の整合性チェック時。
- 使い方:
  - 必須ディレクトリの存在を確認
  - 必須ファイルの存在を確認
- 目的: 「このリポジトリの基本骨格が崩れていないか」を最短で検査する。

### 5.4 agents/
- 役割: エージェント処理の実行スクリプト置き場。
- いつ使うか: 要件整理、dev 修正、review チェックなどの自動化を入れる時。
- 使い方: `pm_agent.sh` / `dev_agent.sh` / `review_agent.sh` を順番に実行するなどの運用を構成する。
- 注意: 現在のリポジトリ構成ではこの配下の実ファイルが少なく、README で利用例が示されることが多い。

---

## 6. templates/

### issue_template.md
- 役割: GitHub Issue のテンプレート。
- いつ使うか: Issue を作成するとき。
- 使い方:
  - Issue の概要
  - 影響範囲
  - 期待結果/実際結果
  - 補足情報
  を記載する。

### pull_request_template.md
- 役割: Pull Request のテンプレート。
- いつ使うか: PR を作成するとき。
- 使い方:
  - 変更内容
  - 理由
  - 関連 Issue
  - 検証結果
  を整理してレビューを容易にする。

---

## 7. workflows/

### workflows/README.md
- 役割: Workflow 一覧と用途の説明書。
- いつ使うか: GitHub Actions の整合性を確認したいとき。
- 使い方: 各 workflow のトリガーと処理内容を見て、どれを使うべきか判断する。

### workflows/ci.yml
- 役割: 最低限の CI。
- トリガー: `push`（`main` / `master`）、`pull_request`
- いつ使うか: 変更後の最小品質確認、PR 前チェック。
- 実行内容:
  - `validate-repo.sh` を実行
  - `lint.sh` を実行

### workflows/deploy-dev.yml
- 役割: 開発環境デプロイの入口。
- トリガー: `workflow_dispatch`（手動実行）
- いつ使うか: 開発用 App Service へデプロイする時。
- 実行内容:
  - Azure 環境チェック
  - プレースホルダーのデプロイ処理
- 注意: 実デプロイコマンドは未実装のプレースホルダー段階。

### workflows/deploy-prod.yml
- 役割: 本番環境デプロイの入口。
- トリガー: `workflow_dispatch`（手動実行）
- いつ使うか: 本番デプロイ前の安全確認や段階的実装時。
- 実行内容:
  - Azure 環境チェック
  - 本番安全措置の前段処理
- 注意: 実デプロイは後続で追加予定。

### workflows/agents-ci.yml
- 役割: エージェント系タスクをまとめて実行する CI パイプライン。
- トリガー: `push`、`pull_request`、`workflow_dispatch`
- いつ使うか: PR や push 時に要件整理・修正・レビューを自動化したいとき。
- 実行内容: PM / Dev / Review 系の処理を順に走らせる想定。

### workflows/agents-dispatch.yml
- 役割: webhook や外部からの dispatch を受けてエージェントを起動する.
- トリガー: `repository_dispatch`, `workflow_dispatch`
- いつ使うか: 外部システムやチャット連携から自動起動したいとき。
- 実行内容: 外部要求を受けてエージェントへ流す。

### workflows/issue-trigger.yml
- 役割: GitHub Issue を起点に自動で作業を開始する.
- トリガー: `issues` イベント（`opened`, `edited`, `reopened`, `labeled`）
- いつ使うか: Issue を起点に開発要求を管理したいとき。
- 実行内容:
  - Issue 本文を `.github/ISSUE.md` に書き出す
  - 日付付き履歴を `.github/issues/` に残す
  - エージェント処理を順番に実行する

---

## 8. 使い分けの基本ルール

- 変更の最小検証は `ci.yml` を使う
- Azure 関連作業の前段確認は `azure-check.sh` を使う
- PR / Issue の標準フォーマットは `templates/` を使う
- 自動化やエージェント実行は `workflows/agents-*.yml` を使う
- 大きな運用方針を確認したいときは `.github/docs/harness-guide.md` を見る

---

## 9. 典型的な運用フロー

1. Issue を作成または更新する
2. `issue-trigger.yml` が発火し、Issue を取り込む
3. 必要に応じて `agents-*.yml` が起動する
4. PR を作成する
5. `ci.yml` が構造と lint を検証する
6. 開発・本番デプロイは `deploy-dev.yml` / `deploy-prod.yml` を使う

この構成により、リポジトリの「運用」「検証」「デプロイ」「記録」を .github 配下で一元管理しやすくなっています。
