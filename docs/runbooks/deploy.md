# デプロイ手順

このアプリの標準公開先は、追加の常時稼働コストがない GitHub Pages です。アプリは `localStorage` を使う静的サイトなので、サーバーやデータベースは必要ありません。

## 公開 URL

https://shunsuke-0202.github.io/next-app-repository/

## GitHub Pages へ再デプロイする手順

### 前提

- GitHub CLI (`gh`) または GitHub のブラウザ操作が使えること
- リポジトリ: `Shunsuke-0202/next-app-repository`
- 公開ブランチ: `main`
- リポジトリは Public
- GitHub Pages の公開元は `GitHub Actions`

### ローカルで検証

リポジトリ直下で実行します。

```bash
cd /home/tshun/azure_practice/app-service
npm ci
npm run lint
npm test -- --runInBand
npm run build
```

`npm run build` は通常の Next.js ビルドです。GitHub Actions では `GITHUB_ACTIONS=true` が設定され、`app-service/out` に静的成果物が生成されます。

### 変更を公開

未コミット変更を確認し、ユーザーの変更を消さずに対象ファイルだけを commit します。

```bash
cd /home/tshun/azure_practice
git status --short
git add <変更したファイル>
git commit -m "説明"
git push origin <作業ブランチ>
```

PR を作成して `main` に merge します。`main` への push が `.github/workflows/deploy-pages.yml` を自動起動します。

### GitHub Actions の確認

```bash
gh run list --repo Shunsuke-0202/next-app-repository --workflow deploy-pages.yml --branch main --limit 1
```

実行結果が `completed / success` になるまで待ちます。失敗時は詳細ログを確認します。

```bash
gh run list --repo Shunsuke-0202/next-app-repository --workflow deploy-pages.yml --branch main --limit 1 --json databaseId,status,conclusion,url
gh run view <RUN_ID> --repo Shunsuke-0202/next-app-repository --log-failed
```

### 公開確認

```bash
curl -L -I https://shunsuke-0202.github.io/next-app-repository/
```

HTTP `200` なら公開済みです。ブラウザでも次の URL を開きます。

https://shunsuke-0202.github.io/next-app-repository/

## GitHub Pages の構成

- Workflow: `.github/workflows/deploy-pages.yml`
- Node.js: 20
- Next.js 出力: `output: "export"`
- Pages 用 base path: `/next-app-repository`
- Artifact: `app-service/out`
- トリガー: `main` への push、または `workflow_dispatch`

## データと制限

- 家計簿データはブラウザごとの `localStorage` に保存されます。
- 別端末・別ブラウザとの同期はありません。
- 認証、サーバー側バックアップ、データベースはありません。
- リポジトリを Public にしているため、ソースコードと Git 履歴も公開されています。

## Azure にデプロイする場合

Azure 手順は `app-service/scripts/deploy-appservice.sh` にあります。

```bash
cd /home/tshun/azure_practice/app-service
export RESOURCE_GROUP="rg-azure-practice-dev"
export LOCATION="japaneast"
export PLAN_NAME="asp-azure-practice-dev"
export APP_NAME="app-service-practice-dev"
export ACR_NAME="<グローバルに一意なACR名>"
bash ./scripts/deploy-appservice.sh
```

このスクリプトは Azure App Service Plan `B1` と Azure Container Registry `Basic` を作成するため、無料デプロイではありません。Azure サブスクリプション、Azure CLI ログイン、Docker、作成権限が必要です。

## 別チャットへ貼る依頼テンプレート

```text
このリポジトリを GitHub Pages にデプロイしてください。

リポジトリ: https://github.com/Shunsuke-0202/next-app-repository
作業ディレクトリ: /home/tshun/azure_practice
アプリ: app-service
公開 URL: https://shunsuke-0202.github.io/next-app-repository/

手順:
1. git status で既存の未コミット変更を確認し、他人の変更を破棄しない。
2. app-service で npm ci、npm run lint、npm test -- --runInBand、npm run build を実行する。
3. 必要な変更だけを commit して feature/* ブランチへ push する。
4. PR を main に merge する。
5. .github/workflows/deploy-pages.yml の実行を確認する。
6. curl -L -I https://shunsuke-0202.github.io/next-app-repository/ で HTTP 200 を確認する。

GitHub Pages は追加の常時稼働コストなしで使う。Azure App Service は B1 課金が発生するため、明示的に指定された場合だけ使う。
```
