import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, TrendingUp, MousePointerClick, Plus } from "lucide-react";
import type { Campaign } from "@/types/database";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function getOpenRate(campaign: Campaign): string {
  const stats = campaign.stats as { sent: number; opens: number } | null;
  if (!stats || stats.sent === 0) return "—";
  return `${((stats.opens / stats.sent) * 100).toFixed(1)}%`;
}

function getClickRate(campaign: Campaign): string {
  const stats = campaign.stats as { sent: number; clicks: number } | null;
  if (!stats || stats.sent === 0) return "—";
  return `${((stats.clicks / stats.sent) * 100).toFixed(1)}%`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch or create organization/publication for this user
  const { data: org } = (await supabase
    .from("organizations")
    .select("id, name, publications(id, name)")
    .eq("owner_id", user.id)
    .limit(1)
    .single()) as { data: { id: string; name: string; publications: { id: string; name: string }[] } | null; error: unknown };

  // If no org yet, show onboarding
  if (!org) {
    return <OnboardingView userId={user.id} />;
  }

  const pub = (org.publications as { id: string; name: string }[])?.[0];

  if (!pub) {
    return <OnboardingView userId={user.id} />;
  }

  // Load stats in parallel
  const [
    { count: totalSubscribers },
    { count: activeSubscribers },
    { data: recentCampaigns },
    { count: totalCampaigns },
  ] = await Promise.all([
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("publication_id", pub.id),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("publication_id", pub.id)
      .eq("status", "active"),
    supabase
      .from("campaigns")
      .select("*")
      .eq("publication_id", pub.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("publication_id", pub.id)
      .eq("status", "sent"),
  ]);

  // Aggregate open rate from recent sent campaigns
  const sentCampaigns = recentCampaigns?.filter((c: Campaign) => c.status === "sent") ?? [];
  const avgOpenRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((acc: number, c: Campaign) => {
          const stats = c.stats as { sent: number; opens: number } | null;
          if (!stats || stats.sent === 0) return acc;
          return acc + (stats.opens / stats.sent) * 100;
        }, 0) / sentCampaigns.length
      : 0;

  const kpis = [
    {
      label: "総購読者数",
      value: formatNumber(totalSubscribers ?? 0),
      sub: `${formatNumber(activeSubscribers ?? 0)} アクティブ`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "送信済みキャンペーン",
      value: formatNumber(totalCampaigns ?? 0),
      sub: "配信完了",
      icon: Mail,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "平均開封率",
      value: sentCampaigns.length > 0 ? `${avgOpenRate.toFixed(1)}%` : "—",
      sub: "直近キャンペーン",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "平均クリック率",
      value: "—",
      sub: "集計中",
      icon: MousePointerClick,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{pub.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">ダッシュボード</p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            新規キャンペーン
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">最近のキャンペーン</CardTitle>
          <Link href="/campaigns">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500">
              すべて表示
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentCampaigns && recentCampaigns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentCampaigns.map((campaign: Campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {campaign.subject}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleDateString("ja-JP")
                        : campaign.send_at
                        ? `予約: ${new Date(campaign.send_at).toLocaleDateString("ja-JP")}`
                        : "下書き"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    {campaign.status === "sent" && (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">開封率</p>
                          <p className="text-sm font-medium text-slate-700">
                            {getOpenRate(campaign)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">クリック率</p>
                          <p className="text-sm font-medium text-slate-700">
                            {getClickRate(campaign)}
                          </p>
                        </div>
                      </>
                    )}
                    <StatusBadge status={campaign.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">まだキャンペーンがありません</p>
              <Link href="/campaigns/new">
                <Button size="sm" className="mt-3">
                  最初のキャンペーンを作成
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "下書き", variant: "secondary" },
    scheduled: { label: "予約中", variant: "outline" },
    sending: { label: "送信中", variant: "default" },
    sent: { label: "送信済み", variant: "outline" },
    cancelled: { label: "キャンセル", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function OnboardingView({ userId }: { userId: string }) {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-xl mb-5">
        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        ニュースレターを始めよう
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        最初にパブリケーション（ニュースレター）を作成してください。
        <br />
        設定から簡単にセットアップできます。
      </p>
      <Link href="/settings">
        <Button>パブリケーションを作成</Button>
      </Link>
    </div>
  );
}
