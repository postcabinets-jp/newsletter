import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, MousePointerClick } from "lucide-react";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, publications(id)")
    .eq("owner_id", user.id)
    .limit(1)
    .single() as { data: { id: string; publications: { id: string }[] } | null };

  const pub = org?.publications?.[0];

  if (!pub) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm">先にパブリケーションを作成してください。</p>
      </div>
    );
  }

  // Subscriber growth — last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentSubscribers } = await supabase
    .from("subscribers")
    .select("subscribed_at, status")
    .eq("publication_id", pub.id)
    .gte("subscribed_at", thirtyDaysAgo.toISOString())
    .order("subscribed_at", { ascending: true }) as {
    data: { subscribed_at: string; status: string }[] | null;
  };

  // Build daily subscriber counts
  const dailyCounts: Record<string, { new: number; unsubscribed: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyCounts[key] = { new: 0, unsubscribed: 0 };
  }

  for (const sub of recentSubscribers ?? []) {
    const day = sub.subscribed_at.split("T")[0];
    if (dailyCounts[day]) {
      if (sub.status === "unsubscribed") {
        dailyCounts[day].unsubscribed++;
      } else {
        dailyCounts[day].new++;
      }
    }
  }

  const chartData = Object.entries(dailyCounts).map(([date, counts]) => ({
    date: date.replace(/^\d{4}-/, ""), // MM-DD
    new: counts.new,
    unsubscribed: counts.unsubscribed,
  }));

  // Campaign performance
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("subject, stats, sent_at")
    .eq("publication_id", pub.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(10) as {
    data: { subject: string; stats: unknown; sent_at: string | null }[] | null;
  };

  const campaignData = (campaigns ?? []).map((c) => {
    const stats = c.stats as { sent: number; opens: number; clicks: number } | null;
    return {
      subject: c.subject.length > 30 ? c.subject.slice(0, 30) + "..." : c.subject,
      openRate: stats && stats.sent > 0 ? Math.round((stats.opens / stats.sent) * 100) : 0,
      clickRate: stats && stats.sent > 0 ? Math.round((stats.clicks / stats.sent) * 100) : 0,
      sent: stats?.sent ?? 0,
    };
  });

  const avgOpenRate =
    campaignData.length > 0
      ? campaignData.reduce((a, c) => a + c.openRate, 0) / campaignData.length
      : 0;
  const avgClickRate =
    campaignData.length > 0
      ? campaignData.reduce((a, c) => a + c.clickRate, 0) / campaignData.length
      : 0;

  const { count: totalSubscribers } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("publication_id", pub.id)
    .eq("status", "active");

  const newThisMonth = Object.values(dailyCounts).reduce((a, c) => a + c.new, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">アナリティクス</h1>
        <p className="text-sm text-slate-500 mt-0.5">過去30日間のパフォーマンス</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "アクティブ購読者",
            value: (totalSubscribers ?? 0).toLocaleString(),
            sub: `+${newThisMonth} 今月`,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "平均開封率",
            value: `${avgOpenRate.toFixed(1)}%`,
            sub: "業界平均: 21.5%",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "平均クリック率",
            value: `${avgClickRate.toFixed(1)}%`,
            sub: "業界平均: 2.6%",
            icon: MousePointerClick,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "送信済みキャンペーン",
            value: campaignData.length.toString(),
            sub: "過去30日",
            icon: BarChart3,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
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

      {/* Charts */}
      <AnalyticsCharts chartData={chartData} campaignData={campaignData} />
    </div>
  );
}
