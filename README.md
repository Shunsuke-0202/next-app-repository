# Azure Practice (App Service Project)

このリポジトリは、App Service を中心にした Azure 実装プロジェクトのハーネス型雛形です。

## 目的

- App Service をメインのデプロイ対象として扱う
- 共通の検証・CI/CD・運用ルールを .github 配下に集約する
- 実装コードを app-service 配下に閉じて管理する
- Azure のインフラ定義は infra/bicep で明確に分離する

## フォルダ構成

```text
azure_practice/
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml
│  │  ├─ deploy-dev.yml
│  │  └─ deploy-prod.yml
│  ├─ scripts/
│  │  ├─ validate-repo.sh
│  │  ├─ lint.sh
│  │  └─ azure-check.sh
│  ├─ templates/
│  │  ├─ pull_request_template.md
│  │  └─ issue_template.md
│  └─ docs/
│     └─ harness-guide.md
│
│
├─ docs/
│  ├─ README.md
│  ├─ architecture/
│  │  └─ overview.md
│  └─ runbooks/
│     └─ deploy.md
│
├─ .editorconfig
├─ .gitignore
├─ Makefile
├─ README.md
└─ .github/
```

## 各フォルダの役割

- .github
  - GitHub Actions の CI/CD
  - 共通スクリプト
  - PR / Issue テンプレート
  - ハーネス運用ガイド

- infra
  - Azure の IaC 定義
  - App Service を構築する Bicep 定義
  - 環境ごとの差分を parameters で管理

- docs
  - システム構成と運用手順の記録
  - アーキテクチャとデプロイ手順を管理

## 使い方

```bash
make validate
make lint
```

## 運用方針

- 共通ルールと自動化は .github で管理する
- 実装コードは app-service 配下に閉じる
- インフラは infra/bicep で宣言的に定義する
- 本番・開発の差分は env/dev などの parameter で管理する

## LLM / システムプロンプト

このプロジェクトでは LLM を利用する際の共通ルールを `docs/prompting_system_prompt.md` に定義し、ランタイムや CI が読み込めるプレーンテキスト版を `.github/system_prompt.txt` に配置しています。

使い方の例（ランタイムでファイルを読み込んでシステムプロンプトとして注入する場合）:

```bash
# シンプルな例: システムプロンプトを標準入力に渡す
cat .github/system_prompt.txt | your-llm-client --system-prompt - --input "ユーザーの質問"
```

ドキュメント管理および運用ルールの詳細は `docs/prompting_system_prompt.md` を参照してください。
