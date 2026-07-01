# Newsletter — セルフホスト型ニュースレタープラットフォーム

Beehiiv・Kitの高額プランから脱出。自分のインフラでニュースレターを運営。購読者データを完全所有。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpostcabinets-jp%2Fnewsletter&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&project-name=my-newsletter&repository-name=newsletter)

## なぜ作ったのか

Beehiivは2024年4月に無警告で値上げ（25K購読者以上で2〜3倍）。Kitは2025年9月に34%値上げ（長期ユーザーは最大400%増）。どちらもアカウント停止は無説明・突然・回復不可。

**Newsletter** はプラットフォームに振り回されない代替として設計した。自分のインフラ上で動き、購読者データを完全所有し、第三者がアカウントを停止できない。

## 機能

- **ビジュアルエディタ** — テキスト・画像・ボタン・コードブロックのブロック構成。モバイルプレビュー内蔵。
- **購読者管理** — CSVインポート・エクスポート、タグセグメント、AND/OR絞り込み
- **キャンペーン管理** — 下書き・スケジュール・送信・統計（開封率・クリック率）
- **ビジュアルオートメーション** — 登録・タグ・クリックトリガーからメールシーケンスを構築
- **アナリティクス** — 購読者増減グラフ・キャンペーン別パフォーマンス・UTM対応
- **有料サブスク** — Stripe連携。プラットフォームカット0%（Stripe手数料のみ）
- **オプトインフォーム** — インライン・ポップアップ・スタンドアロン、埋め込みコード発行
- **カスタムドメイン** — アーカイブページとフォームに独自ドメイン設定
- **REST API** — APIキー認証でサブスクライバーCRUD・キャンペーン送信

## クイックスタート

### 1. Vercelにデプロイ（推奨）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpostcabinets-jp%2Fnewsletter&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&project-name=my-newsletter&repository-name=newsletter)

必要な環境変数:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

### 2. ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/postcabinets-jp/newsletter.git
cd newsletter

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して Supabase の認証情報を入力

# データベースマイグレーション実行（Supabase CLI）
supabase db push

# 開発サーバー起動
npm run dev
```

### 3. Supabaseセットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成（無料枠可）
2. SQL Editor で `supabase/migrations/0001_initial_schema.sql` を実行
3. （任意）`supabase/seed.sql` でサンプルデータ投入
4. Authentication → Providers で Google OAuth を有効化

## 技術スタック

| レイヤ | 採用技術 |
|---|---|
| フロントエンド | Next.js 15 App Router + TypeScript strict |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| データベース | Supabase（PostgreSQL + RLS + Edge Functions） |
| 認証 | Supabase Auth（Email + Google OAuth） |
| メール送信 | Resend / Amazon SES / カスタムSMTP切り替え可 |
| 決済 | Stripe（Webhookで購読状態同期） |
| ホスティング | Vercel Deploy Button |

## セキュリティ

- 全テーブルに Row Level Security (RLS) を適用 — ユーザー間のデータ漏洩を防止
- APIキーはbcryptハッシュで保存
- サーバーアクションのみデータ書き込み可（クライアントからの直接書き込み禁止）
- Supabase Auth によるJWT認証

## 環境変数

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# アプリ
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# メール（任意 — Resend推奨）
RESEND_API_KEY=re_your_api_key

# Stripe（任意 — マネタイズ機能使用時）
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

## ロードマップ

- [ ] リッチなTiptapブロックエディタ（現在はMarkdownエディタ）
- [ ] React Flowビジュアルオートメーションビルダー
- [ ] CSVインポート実装
- [ ] Stripe Webhook実装
- [ ] A/Bテスト（件名）
- [ ] RSS-to-Email
- [ ] リファラルプログラム
- [ ] DKIM/DMARC設定ガイド

## ライセンス

MIT License

---

Built by [POST CABINETS](https://postcabinets.co.jp)
