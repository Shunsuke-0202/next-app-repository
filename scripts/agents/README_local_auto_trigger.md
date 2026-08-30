# ローカル自動トリガーの最小実装

この仕組みは、チャットや対話入力の中で要件を受け取り、
「それが本当に要件か」を確認してから、PM → Dev → Review の流れを自動で開始するための最小構成です。

## 目的

- 人間が要件を入力する
- 確定確認を行う（Yes / No）
- 確定後に `.github/ISSUE.md` を生成する
- その後、webhook を通すかローカル実行でエージェント群を起動する

## 使い方

### 1. 対話的に入力して実行

```bash
python3 scripts/agents/local_auto_trigger.py
```

実行すると:

1. 要件を入力
2. 確定確認を表示
3. `Y` で確定
4. `.github/ISSUE.md` を保存
5. webhook へ送信するか、ローカルでエージェントを実行

### 2. 直接要件を渡して実行

```bash
python3 scripts/agents/local_auto_trigger.py --requirement "ログインページのデザインを修正したい"
```

### 3. ファイルから要件を読む

```bash
python3 scripts/agents/local_auto_trigger.py --requirement-file .github/ISSUE.md
```

### 4. webhook を使う場合

まず webhook サーバーを起動します。

```bash
TRIGGER_TOKEN=secret python3 -m uvicorn scripts.agents.webhook_server:app --host 127.0.0.1 --port 8000
```

その後、ローカルトリガーを実行します。

```bash
TRIGGER_TOKEN=secret WEBHOOK_URL=http://127.0.0.1:8000/trigger \
python3 scripts/agents/local_auto_trigger.py --requirement "新しいAPIを追加したい"
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

## 重要な設計意図

- すべてを自動ではなく「Yes を押した後に進む」ため、誤作動を減らせる
- webhook で外部指示を受ける場合でも、最終的には要件確認を一度通す設計にできる
- ローカルの場合は webhook なしでも動くので、試験や PoC に便利

## 次の拡張案

- 実際に Chat bot から直接要件を受け取り、HTTP POST を発火するラッパー
- GitHub App / issue webhook 経由での自動起動
- 確認ステップを Slack / Discord / Teams 連携に拡張
