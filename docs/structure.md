# リポジトリ構造と各ファイル・フォルダの役割

このドキュメントは、リポジトリ内の主要なファイルやフォルダの目的を簡潔にまとめたものです。新規参入者や運用担当者が素早く把握できることを目的とします。

## ルート

- `README.md` — プロジェクト概要、目的、基本的な使い方を示す。最初に読むファイル。
- `Makefile` — 開発支援コマンド（validate, lint など）。
- `.gitignore`, `.editorconfig` — リポジトリ運用の基本設定。
- `CONTRIBUTING.md` — 開発ルール、ローカル起動手順、PRフロー、LLM運用参照の短いサマリ。

## .github/
- `.github/workflows/` — CI/CD ワークフロー定義（ビルド、テスト、デプロイ、プロンプトチェック等）。
- `.github/scripts/` — CI で使うスクリプト（`check-system-prompt.sh` 等）。
- `.github/system_prompt.txt` — ランタイム/CI が読み込むプレーンテキストのシステムプロンプト（LLM に注入する定義）。
- `.github/templates/` — PR/Issue テンプレートやリポジトリ運用ガイド。

## docs/
- `docs/README.md` — docs ディレクトリの導入と目次（閲覧者向け）。
- `docs/architecture/overview.md` — アーキテクチャ概要と高レベル設計方針。
- `docs/runbooks/deploy.md` — デプロイ手順と環境別の注意点（Azure 向け）。
- `docs/prompting_system_prompt.md` — システムプロンプト（人間向け説明と運用ルール）。
- `docs/prompting.md` — プロンプトテンプレート集とベストプラクティス（プロンプト作成者向け）。
- `docs/runbooks/ai.md` — 実装・運用向けの Runbook（キャッシュ設計、ベクタ検索、CI統合など）。
- `docs/structure.md` — （本ファイル）リポジトリ構造の説明。

## infra/
- `infra/bicep/` — Azure リソースを宣言する Bicep 定義。環境別の parameters は `infra/env/` に格納。
- `infra/README.md` — インフラのセットアップ手順とデプロイ手順の概要。

## 実装コード（例）
- `app-service/` または `web/` (プロジェクトによる) — Next.js 等のアプリケーションコードと関連設定（`package.json`、`Dockerfile`等）。
- `docker/` または `devcontainer.json`（ルート）— 開発用コンテナ設定、`docker-compose.yml` 等の起動例。

## その他運用ファイル
- `docs/prompting_system_prompt.md` と `.github/system_prompt.txt` は連動して使う（説明と実際の注入用ファイル）。
- `CONTRIBUTING.md` は開発者向けの最小限の手順とリンク集を含む。

## 変更フローの推奨
- ドキュメントやシステムプロンプトの変更は必ず PR で行い、レビューを通す。
- `system_prompt.txt` の変更は CI のチェック（`.github/workflows/prompt-check.yml`）で検査されるため、PR に注意点を記載する。

---
この一覧に追加したいファイル・フォルダや別途細かい権限/オーナー割り当て（CODEOWNERS）を追加しますか？
