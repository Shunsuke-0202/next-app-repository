# Infrastructure

ここでは Azure の共通基盤と App Service の構成を定義します。

## 想定構成

- bicep/main.bicep
- bicep/modules/
- bicep/env/dev/

## 基本方針

- 基盤とアプリの境界を明確にする
- 共通モジュールを再利用する
- dev / prod の差分を environment parameter で吸収する
