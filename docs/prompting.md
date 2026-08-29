# Prompting（プロンプト）ガイド

## 目的
人間向けにプロンプトのテンプレート、使用例、ベストプラクティスをまとめます。日常的にプロンプトを作成する人（プロダクト担当、プロンプト作成者）が参照することを想定しています。

## 基本方針
- システムプロンプトは `docs/prompting_system_prompt.md` と `.github/system_prompt.txt` に一元管理されます。ランタイムではプレーンテキスト版を読み込んで注入してください。
- ユーザー向けプロンプトは短く具体的に。必要な情報は参照IDや要約で渡す。
- 出力形式は明文化しておく（JSON, マークダウン, CLIコマンド等）。

## テンプレート集

### 1) 原始人プロンプト（シンプル）
- 目的: 最小限の指示で確実な出力を得る。トークン節約向け。 
```
You are an assistant.
Task: <簡潔なタスク説明>
Output: <出力形式の指定>
Constraints: <必要なら制約>
```

### 2) 構造化出力テンプレート（JSON）
- 目的: 機械で扱いやすい出力を得る。
```
Task: <説明>
Return JSON with keys: {"summary": string, "actions": [{"cmd": string, "desc": string}]}
Example: {"summary":"...","actions":[{"cmd":"make test","desc":"Run tests"}]}
```

### 3) ファイル参照あり（埋め込み/要約を使う場合）
```
Task: Using the provided short summaries and file references, produce a one-paragraph decision.
Context Summaries:
- doc-123: <短い要約>
- file-xyz: <短い抜粋>
Output: Decision with rationale and references to doc IDs.
```

## 推奨パラメータ
- `temperature`: 0.0–0.3（確定的な出力が必要な場合）
- `top_p`: 0.9（デフォルト）
- `max_tokens`: タスクに応じて制限。要約→短め、生成→十分な余裕。

## トークン節約のテクニック
- 長文は事前に要約して注入する（要約キャッシュを利用）。
- 固有名詞や長いコードは参照IDで渡し、必要時のみ抜粋を追加。
- 原始人プロンプトをデフォルト化し、詳細は参照で引く。

## テスト例
- プロンプト単体テストを用意する（期待出力のスナップショット）。
- 変更時はテンプレートの期待値を更新し、PRでレビューする。

## 運用メモ
- テンプレート追加/更新は `docs/prompting.md` に記録し、変更理由を PR に残してください。
- 実装やキャッシュの運用手順は `docs/runbooks/ai.md` を参照してください。
