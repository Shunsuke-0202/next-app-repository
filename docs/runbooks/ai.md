# Runbook: AI / LLM 実装と運用

## 目的
実装エンジニア向けに、システムプロンプト注入、コンテキストキャッシュ、ベクタ検索、CI統合などの運用手順をまとめます。

## システムプロンプト注入（ランタイム）
- ファイル: `.github/system_prompt.txt` を読み込み、API クライアントの `system` フィールドに渡す。

例（疑似シェル）:

```bash
SYSTEM_PROMPT=$(cat .github/system_prompt.txt)
# 任意の LLM クライアントで system prompt を渡す例
your-llm-client --system "$SYSTEM_PROMPT" --input-file input.json
```

- CI (GitHub Actions) で注入する場合、ワークフロー内で `cat` して環境変数やシークレットとして渡す。

例（GitHub Actions スニペット）:

```yaml
- name: Read system prompt
  run: echo "SYSTEM_PROMPT<<EOF" >> $GITHUB_ENV && cat .github/system_prompt.txt >> $GITHUB_ENV && echo "EOF" >> $GITHUB_ENV
- name: Call LLM
  run: your-llm-client --system "$SYSTEM_PROMPT" --input "$INPUT"
```

## コンテキストキャッシュ（要約フロー）
1. 長文ドキュメントを受け取る。
2. 要約器で短い要約（例: 1-2 文）を生成。
3. 要約とメタデータ（source_id, timestamp, embedding_id）をキャッシュストアに保存。
4. 後続リクエストでは埋め込み検索で関連要約のみを引き、必要最小限の抜粋を注入する。

### キャッシュ設計（推奨）
- ストレージ: キー-バリュー（Redis）＋埋め込みストア（FAISS/Weaviate/Pinecone）
- 要約形式: プレーンテキスト（短い要約）＋参照ID
- TTL: 要約は 24h–7d の範囲で自動更新を推奨（データの更新頻度に依存）
- 更新戦略: 元本文が変更されたら再要約。コミットハッシュやドキュメントバージョンをメタデータに持たせる。

## 埋め込みとベクタ検索
- 埋め込みモデル: 小～中型の埋め込みモデルを選定。オンプレ/ローカル運用なら `sentence-transformers` 系、クラウドならベンダー提供の埋め込みを検討。
- ベクタDB: ローカル PoC は FAISS、運用は Weaviate/Pinecone/Chroma など。
- スコア閾値とトップK: top_k=5、score_threshold を設定してノイズを減らす。

## CI への組み込み
- PR チェックでプロンプトの静的チェック（長さ、高リスク語句の検出）を実行するワークフローを追加。
- system_prompt.txt の変更は PR を必須にするルールを運用（ブランチ保護や CODEOWNERS を活用）。

## ロギング・コスト管理
- LLM 呼び出しごとにコスト・トークン数を計測してメトリクスを送る（Datadog/Prometheus等）。
- 高頻度ジョブはバッチ化や要約化で呼び出し回数を削減。

## セキュリティとガバナンス
- 機密情報は入力前に検出・マスクするフィルタを実装。
- システムプロンプトやテンプレートにはシークレットを絶対に含めない。
- アクセス制御: ベクタDBや要約キャッシュは認証付きの内部ネットワークに限定。

## テストと検証
- モックと差分テスト: プロンプトテンプレートの変更は期待出力のスナップショットテストを追加。
- 災害復旧: ベクタDB のバックアップと再構築手順をドキュメント化。

## 付録: 簡易フロー図（擬似）
1. ユーザー入力
2. 戦略: キャッシュに関連要約があれば注入、なければ元ドキュメントを要約して保存
3. システムプロンプト（`.github/system_prompt.txt`）を先頭に注入
4. LLM 呼び出し → 出力
5. 出力をパースして必要ならアクション実行

---
参照: `docs/prompting_system_prompt.md`, `docs/prompting.md`, `.github/system_prompt.txt`
