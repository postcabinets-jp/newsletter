import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Plus } from "lucide-react";
import type { Campaign } from "@/types/database";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "下書き", className: "bg-slate-100 text-slate-600 border-slate-200" },
  scheduled: { label: "予約中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  sending: { label: "送信中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  sent: { label: "送信済み", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "キャンセル", className: "bg-red-50 text-red-600 border-red-200" },
};

function getStats(campaign: Campaign) {
  const stats = campaign.stats as {
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
  } | null;
  if (!stats || stats.sent === 0) return null;
  return {
    sent: stats.sent,
    openRate: ((stats.opens / stats.sent) * 100).toFixed(1),
    clickRate: ((stats.clicks / stats.sent) * 100).toFixed(1),
  };
}

export default async function CampaignsPage() {
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

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("publication_id", pub.id)
    .order("created_at", { ascending: false });

  const groupedByStatus: Record<string, Campaign[]> = {
    draft: [],
    scheduled: [],
    sending: [],
    sent: [],
    cancelled: [],
  };

  for (const c of (campaigns ?? []) as Campaign[]) {
    groupedByStatus[c.status]?.push(c);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">キャンペーン</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            合計 {campaigns?.length ?? 0} 件
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            新規キャンペーン
          </Button>
        </Link>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-6">
          {["draft", "scheduled", "sending", "sent"].map((status) => {
            const items = groupedByStatus[status];
            if (items.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {STATUS_CONFIG[status]?.label}（{items.length}）
                </h2>
                <div className="space-y-2">
                  {items.map((campaign) => {
                    const stats = getStats(campaign);
                    const { label, className } = STATUS_CONFIG[campaign.status] ?? {
                      label: campaign.status,
                      className: "bg-slate-100 text-slate-500 border-slate-200",
                    };
                    return (
                      <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                        <Card className="border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {campaign.subject}
                                </p>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${className} shrink-0`}
                                >
                                  {label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">
                                {campaign.preview_text ?? "プレビューテキストなし"} ·{" "}
                                {campaign.sent_at
                                  ? new Date(campaign.sent_at).toLocaleDateString("ja-JP", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "未送信"}
                              </p>
                            </div>
                            {stats && (
                              <div className="flex items-center gap-6 shrink-0">
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">送信数</p>
                                  <p className="text-sm font-semibold text-slate-900">{stats.sent}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">開封率</p>
                                  <p className="text-sm font-semibold text-slate-900">{stats.openRate}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">クリック率</p>
                                  <p className="text-sm font-semibold text-slate-900">{stats.clickRate}%</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">まだキャンペーンがありません</p>
          <p className="text-slate-400 text-sm mt-1">
            最初のニュースレターを作成してみましょう
          </p>
          <Link href="/campaigns/new">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" />
              キャンペーンを作成
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
