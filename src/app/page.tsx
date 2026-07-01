import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Zap,
  BarChart3,
  CreditCard,
  Globe,
  Code2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: Mail,
    title: "ビジュアルブロックエディタ",
    description:
      "Tiptapベースのリッチテキストエディタ。画像・動画・ボタン・コードブロックをドラッグ&ドロップで組み合わせ。モバイルプレビュー内蔵。",
  },
  {
    icon: Users,
    title: "購読者管理 + タグセグメント",
    description:
      "CSVインポート・エクスポート、重複自動除去、バウンス抑制。AND/OR条件でセグメントを柔軟に絞り込める。",
  },
  {
    icon: Zap,
    title: "ビジュアルオートメーション",
    description:
      "登録・タグ付与・リンククリックなどのトリガーからステップを組み合わせるフローチャートUI。Kit水準のシーケンスを自分のインフラで。",
  },
  {
    icon: BarChart3,
    title: "アナリティクスダッシュボード",
    description:
      "開封率・クリック率・退会率・バウンス率を時系列で表示。UTMパラメータ対応、流入元別集計。",
  },
  {
    icon: CreditCard,
    title: "有料サブスク（Stripe連携）",
    description:
      "月額・年額プランを設定してStripeで決済。プラットフォームカット0%（Stripe手数料のみ）。Webhook自動同期。",
  },
  {
    icon: Globe,
    title: "カスタムドメイン + アーカイブ",
    description:
      "アーカイブページとオプトインフォームに独自ドメインを設定。SEO対応の静的ページを自動生成。",
  },
];

const PAIN_POINTS = [
  "Beehiiv: 2024年4月に無警告で値上げ（25K以上で2〜3倍）",
  "Kit: 2025年9月に34%値上げ。長期ユーザーは最大400%増",
  "アカウント停止は無説明・突然・回復不可",
  "プラットフォームのルール変更でコンテンツを人質にされる",
];

const CHECKLIST = [
  "突然の値上げゼロ — 自分のVPS/Vercel/Supabase代のみ",
  "アカウント停止ゼロ — 第三者が止められない",
  "データ完全所有 — エクスポートいつでも可能",
  "無制限パブリケーション — 複数ニュースレター管理",
  "コード公開 — フォークして改造できる",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 bg-slate-900 rounded-md">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">Newsletter</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/postcabinets-jp/newsletter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="hidden sm:block">GitHub</span>
            </a>
            <Link href="/login">
              <Button variant="outline" size="sm">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">無料で始める</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-xs font-medium border-slate-300 text-slate-600">
            OSS / セルフホスト / MIT License
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Beehiiv・Kitの値上げから
            <br />
            もう振り回されない
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto">
            自分のインフラで動くセルフホスト型ニュースレタープラットフォーム。
            購読者データを完全所有し、突然のアカウント停止・価格改定のリスクをゼロにする。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                今すぐ無料で試す
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/postcabinets-jp/newsletter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                <GithubIcon className="w-4 h-4" />
                GitHub で見る
              </Button>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            クレジットカード不要 · MIT ライセンス · Vercel + Supabase 無料枠で動く
          </p>
        </div>
      </section>

      {/* Pain points vs Solution */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                業界の現実
              </p>
              <h2 className="text-2xl font-bold text-white mb-6">
                プラットフォームに
                <br />
                振り回され続ける問題
              </h2>
              <ul className="space-y-3">
                {PAIN_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                Newsletter の答え
              </p>
              <h2 className="text-2xl font-bold text-white mb-6">
                あなたのインフラで
                <br />
                完全な制御権を持つ
              </h2>
              <ul className="space-y-3">
                {CHECKLIST.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Beehiiv・Kitの全機能を OSS で
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              ビジュアルエディタからオートメーション・マネタイズまで、
              エンタープライズ水準の機能を自分のサーバーで動かせる。
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded-lg mb-4 shadow-sm">
                  <Icon className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-4 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2">本番グレードのスタック</h2>
            <p className="text-slate-500 text-sm">最新技術でスケールしながら安心して運用できる</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Next.js 15", sub: "App Router" },
              { name: "Supabase", sub: "PostgreSQL + RLS" },
              { name: "Tailwind CSS v4", sub: "shadcn/ui" },
              { name: "Tiptap v2", sub: "ブロックエディタ" },
              { name: "Stripe", sub: "決済" },
              { name: "Vercel", sub: "ホスティング" },
            ].map(({ name, sub }) => (
              <div
                key={name}
                className="text-center p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <p className="text-xs font-semibold text-slate-800">{name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deploy CTA */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <Code2 className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">1クリックでデプロイ</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-lg mx-auto">
            Vercel + Supabaseの無料枠で今すぐ動かせる。
            数百人の購読者なら月0円で運用できる。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpostcabinets-jp%2Fnewsletter&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&project-name=my-newsletter&repository-name=newsletter"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://vercel.com/button" alt="Deploy with Vercel" className="h-10" />
            </a>
            <Link href="/register">
              <Button className="h-10 gap-2">
                クラウド版を試す（無料）
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-slate-900 rounded-md">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Newsletter</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">MIT License</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/postcabinets-jp/newsletter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              GitHub
            </a>
            <span className="text-xs text-slate-400">
              Built by{" "}
              <a
                href="https://postcabinets.co.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700"
              >
                POST CABINETS
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
