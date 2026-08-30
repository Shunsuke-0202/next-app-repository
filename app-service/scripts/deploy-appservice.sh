#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-azure-practice-dev}"
LOCATION="${LOCATION:-japaneast}"
PLAN_NAME="${PLAN_NAME:-asp-azure-practice-dev}"
APP_NAME="${APP_NAME:-app-service-practice-dev}"
ACR_NAME="${ACR_NAME:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [[ -z "$ACR_NAME" ]]; then
  echo "ACR_NAME is required. Example: export ACR_NAME=<acr-name>"
  exit 1
fi

az account show >/dev/null 2>&1 || {
  echo "Azure CLI にログインしてください: az login"
  exit 1
}

az group create --name "$RESOURCE_GROUP" --location "$LOCATION" >/dev/null

az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1 || \
  az acr create --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku Basic >/dev/null

az appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1 || \
  az appservice plan create --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku B1 --is-linux >/dev/null

az acr login --name "$ACR_NAME"

IMAGE_REF="$ACR_NAME.azurecr.io/app-service-next:$IMAGE_TAG"
docker build -t "$IMAGE_REF" .
docker push "$IMAGE_REF"

az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1 || \
  az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --name "$APP_NAME" \
    --deployment-container-image-name "$IMAGE_REF" >/dev/null

az webapp config container set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --docker-custom-image-name "$IMAGE_REF" \
  --docker-registry-server-url "https://$ACR_NAME.azurecr.io" \
  --docker-registry-server-user "$(az acr credential show --name "$ACR_NAME" --query username -o tsv)" \
  --docker-registry-server-password "$(az acr credential show --name "$ACR_NAME" --query passwords[0].value -o tsv)" >/dev/null

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings WEBSITES_PORT=3000 NODE_ENV=production >/dev/null

az webapp restart --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null

echo "Deployment complete: https://$APP_NAME.azurewebsites.net"
