# ローカル自動トリガーの最小実装

この仕組みは、チャットや対話入力の中で要件を受け取り、
「それが本当に要件か」を確認してから、PM → Dev → Review の流れを自動で開始するための最小構成です。

## 目的

- 人間が要件を入力する
- 確定確認を行う（Yes / No）
- 確定後に `.github/ISSUE.md` を生成する
- その後、webhook を通すかローカルでエージェントを起動する

## 使い方

### 1. 対話的に入力して実行

```bash
python3 .github/scripts/agents/local_auto_trigger.py
```

### 2. 直接要件を渡して実行

```bash
python3 .github/scripts/agents/local_auto_trigger.py --requirement "ログインページのデザインを修正したい"
```

### 3. ファイルから要件を読む

```bash
python3 .github/scripts/agents/local_auto_trigger.py --requirement-file .github/ISSUE.md
```

### 4. webhook を使う場合

まず webhook サーバーを起動します。

```bash
TRIGGER_TOKEN=secret python3 -m uvicorn .github.scripts.agents.webhook_server:app --host 127.0.0.1 --port 8000
```

その後、ローカルトリガーを実行します。

```bash
TRIGGER_TOKEN=secret WEBHOOK_URL=http://127.0.0.1:8000/trigger \
python3 .github/scripts/agents/local_auto_trigger.py --requirement "新しいAPIを追加したい"
```

## 実行フロー

```text
ユーザー入力
  ↓
「要件か？」を確認
  ↓
Yes
  ↓
.github/ISSUE.md を作成
  ↓
webhook POST /trigger
  or ローカル起動
  ↓
PM agent
  ↓
Dev agent
  ↓
Review agent
```
