# App Service + Next.js

ローカル開発と Azure App Service へのデプロイを両立する構成です。

## 1. ローカル開発

### 直接実行

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### Docker で開発

```bash
docker compose up --build
```

`docker-compose.yml` は開発用コンテナを起動し、ホットリロードを利用します。

## 2. 本番イメージビルド

```bash
npm run build
docker build -t app-service-next:prod .
```

この Dockerfile は App Service へそのまま載せられる本番用の構成です。

## 3. Azure App Service へデプロイ

前提:
- Azure CLI にログイン済み
- Azure の Resource Group と App Service Plan を用意済み
- ACR を利用する場合は `ACR_NAME` と認証情報を設定済み

```bash
export RESOURCE_GROUP="rg-azure-practice-dev"
export LOCATION="japaneast"
export PLAN_NAME="asp-azure-practice-dev"
export APP_NAME="app-service-practice-dev"
export ACR_NAME="<acr-name>"

bash ./scripts/deploy-appservice.sh
```

スクリプトは以下を実行します。
- Docker イメージのビルド
- ACR への push
- App Service の作成または更新
- `WEBSITES_PORT=3000` の設定

## 4. 典型的な開発フロー

```bash
npm run dev
# 変更を反映しながら開発
npm run build
bash ./scripts/deploy-appservice.sh
```

ローカル開発をベースにし、完成した状態でそのまま Azure にデプロイできる流れを想定しています。
