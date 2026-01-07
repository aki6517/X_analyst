# ツイート全文取得機能のテストガイド

## テスト環境
- サーバー起動: `npm run dev`
- アクセス: http://localhost:3001/analyze

## テストケース

### 1. 通常のツイート（280文字以内）
**テスト用URL例:**
```
https://x.com/[username]/status/[tweet_id]
```

**期待動作:**
- URLを貼り付けると自動でツイート本文を取得
- 著者名とハンドル名が表示される
- テキストエリアにツイート本文が自動入力される

### 2. 長文ツイート（280文字以上）
**テスト用URL例:**
- 280文字を超える長文ツイートのURL

**期待動作:**
- `note_tweet` から全文を取得
- コンソールに "✓ Long-form tweet detected (note_tweet)" が表示される
- 280文字を超える全文が取得される

### 3. 様々なURL形式
**テスト対象:**
```
https://twitter.com/username/status/123456789
https://x.com/username/status/123456789
https://vxtwitter.com/username/status/123456789
https://fxtwitter.com/username/status/123456789
https://fixupx.com/username/status/123456789
https://www.x.com/username/status/123456789
```

**期待動作:**
- すべてのURL形式で正常に取得できる
- バックエンドで自動的に正規化される

### 4. エラーハンドリング
**テストケース:**

a) 存在しないツイートID
```
https://x.com/username/status/999999999999999999
```
**期待:** エラーメッセージ表示

b) 無効なURL形式
```
https://facebook.com/post/123
```
**期待:** 何も実行されない（自動取得がトリガーされない）

c) プライベート/削除されたツイート
**期待:** エラーメッセージ表示

### 5. リトライ機能
**テスト方法:**
- ネットワークを一時的に切断してURLを入力
- またはレート制限に達するまで連続でリクエスト

**期待動作:**
- 最大3回までリトライ
- コンソールにリトライログが表示される
- レート制限時は指数バックオフで待機

## 手動テスト手順

1. **開発サーバー起動**
   ```bash
   cd x-analyzer
   npm run dev
   ```

2. **ブラウザで開く**
   - http://localhost:3001/analyze にアクセス

3. **ツイートURLを入力**
   - 「投稿URLを貼り付け」フィールドに対象URLを貼り付け
   - 自動的に取得が開始される

4. **結果確認**
   - ✓ 取得成功メッセージ
   - 著者情報の表示
   - ツイート本文の自動入力

5. **コンソール確認**
   - ブラウザの開発者ツールでコンソールを開く
   - エラーやログメッセージを確認

## デバッグ用コンソールログ

以下のログが出力されます：

- `✓ Long-form tweet detected (note_tweet)` - 長文ツイート検出
- `Rate limited, retrying after Xms` - レート制限時のリトライ
- `Syndication API returned [status]` - APIレスポンスステータス
- `Missing text or user data` - データ不足エラー
- `Syndication API error (attempt X/3)` - リトライ実行中

## 改善内容の確認ポイント

✅ **長文ツイートの完全取得**
- 280文字以上のツイートが全文取得できているか

✅ **リトライ機能**
- エラー時に自動でリトライされているか
- 最大3回まで試行されているか

✅ **URL形式の拡張**
- vxtwitter.com などのURLも正常に処理できるか

✅ **テキスト正規化**
- 余分な空白が削除されているか
- 改行が適切に処理されているか

✅ **エラーハンドリング**
- わかりやすいエラーメッセージが表示されるか
- タイムアウト時の処理が適切か
