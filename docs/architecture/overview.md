# Architecture Overview

## Summary

This project is designed as an App Service-first Azure repository.

## Layers
- infra/terraform: infrastructure as code
- .github: repository operations, CI/CD, validation
- docs: architecture and runbooks

## Deployment model

- Dev workflow deploys to the development environment
- Prod workflow deploys to the production environment
- Azure resources are managed declaratively through Bicep

## プロンプト（システムプロンプト）

プロンプトに関する方針はユーザーが毎回参照するドキュメントではなく、LLM に常に渡す「システムプロンプト（人格・振る舞い定義）」として管理します。実行時にはこのシステムプロンプトを最優先で注入し、ユーザー入力はそれに従う形で処理します。

### 目的

- LLM の一貫した振る舞い（トーン、役割、出力フォーマット）を保証する。
- トークン使用量を削減するため、システムプロンプトは簡潔かつテンプレート化して運用する。

### 保管場所と運用

- システムプロンプトは `docs/prompting_system_prompt.md`（または `docs/prompting/system_prompt.txt`）に一元管理し、CIやランタイムで参照できるようにする。
- ユーザ向けテンプレート・使用例は `docs/prompting.md` に置き、システムプロンプトの説明や変更履歴への参照を記載する。

### システムプロンプト例（テンプレート）

以下は運用向けの簡易テンプレート例。実環境ではプロジェクト固有のルールや安全制約を追加してください。

```
System Prompt:
- Role: "Assistant" — You are a concise, safety-first engineering assistant for the project.
- Tone: professional, Japanese primary, concise answers.
- Behavior: Prefer short, actionable outputs; always include references to repository files if applicable.
- Constraints: Do not reveal secrets; follow project's security guidelines; minimize token usage by asking clarifying questions only when necessary.
- Output format: If returning code or file paths, wrap them in explicit blocks and include path links.
```

運用面では、このシステムプロンプトをベースに少量の動的コンテキスト（要約キャッシュや該当ドキュメントの短い抜粋）だけを都度追加して呼び出すことで、トークン効率を上げます。

