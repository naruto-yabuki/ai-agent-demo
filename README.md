# 売掛金回収AI Agent デモ

製造業向け「請求・入金確認・督促AI Agent」の営業デモです。実LLM・外部API・DBには接続せず、モックデータとルールベースのロジックでAI Agentの業務代行イメージを再現したフロントエンドのみのデモアプリです。

## 主な機能

- ダッシュボード（KPI・入金状況グラフ・遅延日数別グラフ・顧客別未入金ランキング）
- AI処理実行画面（銀行明細と請求データの自動照合をリアルタイム風ログで表示）
- 請求・入金一覧（フィルター・検索付き）
- 請求詳細・督促メール作成画面（AI判断・督促メール案・承認アクション）
- 営業承認画面（承認・保留・差し戻し・直接連絡）
- AI対応履歴画面

## 技術構成

- Next.js (App Router) / React / TypeScript
- Tailwind CSS
- Recharts / lucide-react
- 状態管理：React Context + useState（DB・認証なし）

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 を開いてください。

「本日の入金確認を実行」ボタンからAI Agentの処理フローを体験できます。
