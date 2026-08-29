# CONTRIBUTING

このリポジトリの開発ルールと手順の要点を記載します。

## 開発ルール（要約）

- フレームワーク: Next.js を使用します。
- 動作環境: ローカル開発と Azure デプロイの両方で動作することを目標とします。詳細は `infra/README.md` と `docs/runbooks/deploy.md` を参照してください。
- コンテナ開発: Docker を使ったローカル開発をサポートします。`docker/` またはリポジトリルートの `devcontainer.json`、`docker-compose.yml` を参照してください。

## LLM / プロンプト（運用参照）

このプロジェクトでは LLM を利用する際の共通システムプロンプトを以下の場所で管理します。ランタイムや CI はプレーンテキスト版を読み込んでシステムプロンプトとして注入してください。

- 人間向け説明と運用ルール: `docs/prompting_system_prompt.md`
- ランタイム/CI が読み込むプレーンテキスト: `.github/system_prompt.txt`

使用例（ランタイムでファイルを読み込んで利用する簡易例）:

```bash
cat .github/system_prompt.txt | your-llm-client --system-prompt - --input "ユーザーの質問"
```

## ローカル起動（簡易）

1. 依存関係をインストール

```bash
# 例（プロジェクトルートのウェブアプリが `web` にある場合）
cd web
pnpm install
```

2. ローカル開発サーバ起動（Next.js）

```bash
pnpm dev
```

3. Docker で起動する場合

```bash
docker-compose up --build
```

---

リポジトリに変更を加える際は PR を作成し、コードレビューを通してください。