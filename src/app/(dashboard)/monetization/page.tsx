import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, ExternalLink } from "lucide-react";
import type { SubscriptionPlan } from "@/types/database";

export default async function MonetizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = (await supabase
    .from("organizations")
    .select("id, publications(id, name)")
    .eq("owner_id", user.id)
    .limit(1)
    .single()) as { data: { id: string; publications: { id: string; name: string }[] } | null; error: unknown };

  const pub = (org?.publications as { id: string; name: string }[])?.[0];

  if (!pub) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm">先にパブリケーションを作成してください。</p>
      </div>
    );
  }

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("publication_id", pub.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">マネタイズ</h1>
          <p className="text-sm text-slate-500 mt-0.5">有料購読プランの管理</p>
        </div>
        <Button size="sm" disabled>
          <Plus className="w-4 h-4 mr-1.5" />
          プランを追加
        </Button>
      </div>

      {/* Stripe connection status */}
      <Card className="border-amber-200 bg-amber-50 mb-6">
        <CardContent className="p-4 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Stripe 未接続</p>
            <p className="text-xs text-amber-700 mt-0.5">
              有料プランを有効にするには Stripe アカウントを接続してください
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0" disabled>
            Stripe を接続
          </Button>
        </CardContent>
      </Card>

      {plans && plans.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">有料プラン</h2>
          <div className="grid grid-cols-2 gap-4">
            {(plans as SubscriptionPlan[]).map((plan) => (
              <Card key={plan.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.description ?? ""}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1 ${plan.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    ¥{(plan.amount_cents / 100).toLocaleString()}
                    <span className="text-sm font-normal text-slate-400 ml-1">
                      / {plan.interval === "month" ? "月" : plan.interval === "year" ? "年" : "一回"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-4">
              <CreditCard className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-600 font-medium">有料プランがありません</p>
            <p className="text-slate-400 text-sm mt-1">
              Stripeを接続して有料サブスクリプションを始めましょう
            </p>
            <p className="text-xs text-slate-300 mt-2">プラットフォーム手数料 0%（Stripe手数料のみ）</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
