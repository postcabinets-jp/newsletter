import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap } from "lucide-react";
import type { Automation } from "@/types/database";

const TRIGGER_LABELS: Record<string, string> = {
  subscriber_added: "新規登録時",
  tag_added: "タグ追加時",
  tag_removed: "タグ削除時",
  paid_subscription_started: "有料登録開始時",
  paid_subscription_cancelled: "有料登録解約時",
  campaign_link_clicked: "リンククリック時",
};

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: automation } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .single();

  if (!automation) notFound();

  const typedAutomation = automation as Automation;
  const flowJson = typedAutomation.flow_json as {
    nodes: { id: string; data: { label: string } }[];
    edges: { id: string; source: string; target: string }[];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/automations">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            オートメーション一覧
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-semibold text-slate-900">{typedAutomation.name}</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Flow visualization */}
        <div className="col-span-2">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">ワークフロー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flowJson.nodes.map((node, i) => (
                  <div key={node.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      {i < flowJson.nodes.length - 1 && (
                        <div className="w-px h-6 bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 min-h-[32px] flex items-center">
                      <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
                        <p className="text-slate-700 font-medium text-xs">{node.data.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                ビジュアルフロービルダーは近日公開予定です
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ステータス</span>
                <span className="font-medium">{typedAutomation.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">トリガー</span>
                <span className="font-medium text-xs">
                  {TRIGGER_LABELS[typedAutomation.trigger_type] ?? typedAutomation.trigger_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ステップ数</span>
                <span className="font-medium">{flowJson.nodes.length}</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" size="sm" disabled>
            フローを編集
          </Button>
        </div>
      </div>
    </div>
  );
}
