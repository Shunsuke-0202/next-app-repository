# Agents Harness

このリポジトリに簡易的なエージェントハーネスを追加しました。

- `scripts/agents/pm_agent.sh` — 要件整理ハーネス（課題テキストを `artifacts/requirements.txt` に出力）
- `scripts/agents/dev_agent.sh` — テスト実行と自動修正のループ（`MAX_ATTEMPTS` 環境変数で制御）
- `scripts/agents/review_agent.sh` — lint / build のレビューチェック
- `.github/workflows/agents-ci.yml` — GitHub Actions ワークフロー（エージェントの順次実行）

使い方:

ローカルで簡単に試す:

```bash
bash scripts/agents/pm_agent.sh
bash scripts/agents/dev_agent.sh
bash scripts/agents/review_agent.sh
```

GitHub Actionsではプルリクやpush時に `.github/workflows/agents-ci.yml` が実行されます。

Webhook トリガー:

- `scripts/agents/webhook_server.py` を追加しました。チャットや外部サービスから `POST /trigger` を受け、`.github/ISSUE.md` を書き込み、設定があれば GitHub の `repository_dispatch` を呼び出して Actions を起動します。
- `scripts/agents/requirements.txt` に依存を追加しました（FastAPI/uvicorn/requests）。
- `.github/workflows/agents-dispatch.yml` を追加しました。`repository_dispatch` イベント（`run-agents`）と手動 `workflow_dispatch` でエージェントを起動します。

Webhook サーバーの起動例:

```bash
python -m pip install -r scripts/agents/requirements.txt
# 環境変数: TRIGGER_TOKEN, GITHUB_TOKEN, GITHUB_REPO
TRIGGER_TOKEN=secret GITHUB_TOKEN=ghp_xxx GITHUB_REPO=owner/repo python -m uvicorn scripts.agents.webhook_server:app --host 127.0.0.1 --port 8000
```

チャット等からのリクエスト例:

```bash
curl -X POST http://127.0.0.1:8000/trigger \
	-H "Content-Type: application/json" \
	-H "X-Trigger-Token: secret" \
	-d '{"issue":"課題本文をここに"}'
```

備考:
- `GITHUB_REPO` は `owner/repo` 形式で指定します。サーバーが `GITHUB_TOKEN` を検出すると GitHub に `repository_dispatch` を送信し、`.github/workflows/agents-dispatch.yml` が起動します。
- セキュリティ: `TRIGGER_TOKEN` を安全に管理してください（プロダクションでは TLS と追加認証を推奨）。

