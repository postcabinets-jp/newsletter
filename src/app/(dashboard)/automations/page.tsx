import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus } from "lucide-react";
import type { Automation } from "@/types/database";

const TRIGGER_LABELS: Record<string, string> = {
  subscriber_added: "新規登録時",
  tag_added: "タグ追加時",
  tag_removed: "タグ削除時",
  paid_subscription_started: "有料登録開始時",
  paid_subscription_cancelled: "有料登録解約時",
  campaign_link_clicked: "リンククリック時",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "下書き", className: "bg-slate-100 text-slate-600 border-slate-200" },
  active: { label: "有効", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paused: { label: "停止中", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default async function AutomationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = (await supabase
    .from("organizations")
    .select("id, publications(id)")
    .eq("owner_id", user.id)
    .limit(1)
    .single()) as { data: { id: string; publications: { id: string }[] } | null; error: unknown };

  const pub = (org?.publications as { id: string }[])?.[0];

  if (!pub) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm">先にパブリケーションを作成してください。</p>
      </div>
    );
  }

  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .eq("publication_id", pub.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">オートメーション</h1>
          <p className="text-sm text-slate-500 mt-0.5">自動化されたメール送信ワークフロー</p>
        </div>
        <Button size="sm" disabled>
          <Plus className="w-4 h-4 mr-1.5" />
          新規オートメーション
        </Button>
      </div>

      {automations && automations.length > 0 ? (
        <div className="space-y-3">
          {(automations as Automation[]).map((automation) => {
            const { label, className } = STATUS_CONFIG[automation.status] ?? {
              label: automation.status,
              className: "bg-slate-100 text-slate-500",
            };
            return (
              <Link key={automation.id} href={`/automations/${automation.id}`}>
                <Card className="border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-9 h-9 bg-indigo-50 rounded-lg shrink-0">
                      <Zap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-900">{automation.name}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${className}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        トリガー: {TRIGGER_LABELS[automation.trigger_type] ?? automation.trigger_type}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">作成日</p>
                      <p className="text-xs font-medium text-slate-600">
                        {new Date(automation.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl mb-4">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-slate-600 font-medium">オートメーションがありません</p>
          <p className="text-slate-400 text-sm mt-1">
            登録トリガーやタグでメールを自動送信できます
          </p>
        </div>
      )}
    </div>
  );
}
