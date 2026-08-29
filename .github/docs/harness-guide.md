# Harness Guide

このプロジェクトは App Service を中心とした Azure 実装ハーネスです。

## 基本方針

- App Service をメインの実装対象とする
- 共通の運用・検証・自動化は .github 配下に集約する
- 実装コードは app-service 配下に配置する
- Azure リソースや環境差分は infra/bicep で管理する

## 運用ルール

1. 変更は PR を通してレビューする
2. CI で構造と lint を検証する
3. 環境ごとのデプロイは dev / prod workflow で分離する
4. シークレットは GitHub Actions の secrets で管理する

## 推奨する拡張

- Azure login と deployment action の追加
- Bicep linter や policy check の導入
- health check と monitoring の追加
- app-service/config の環境別分離
