import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Campaign } from "@/types/database";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const typedCampaign = campaign as Campaign;

  const stats = typedCampaign.stats as {
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
  } | null;

  const metricsData = stats && stats.sent > 0
    ? [
        { label: "送信数", value: stats.sent, sub: "配信" },
        { label: "開封率", value: `${((stats.opens / stats.sent) * 100).toFixed(1)}%`, sub: `${stats.opens}件` },
        { label: "クリック率", value: `${((stats.clicks / stats.sent) * 100).toFixed(1)}%`, sub: `${stats.clicks}件` },
        { label: "退会", value: stats.unsubscribes, sub: "件" },
        { label: "バウンス", value: stats.bounces, sub: "件" },
      ]
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            キャンペーン一覧
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-semibold text-slate-900 truncate">
          {typedCampaign.subject}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Stats */}
          {metricsData && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-700">パフォーマンス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {metricsData.map(({ label, value, sub }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content preview */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">メール本文</CardTitle>
            </CardHeader>
            <CardContent>
              {typedCampaign.content_html ? (
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: typedCampaign.content_html }}
                />
              ) : (
                <p className="text-slate-400 text-sm">本文がありません</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">キャンペーン情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ステータス</span>
                <span className="font-medium">{typedCampaign.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">作成日</span>
                <span>{new Date(typedCampaign.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
              {typedCampaign.sent_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">送信日</span>
                  <span>{new Date(typedCampaign.sent_at).toLocaleDateString("ja-JP")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {typedCampaign.status === "draft" && (
            <Link href={`/campaigns/new`}>
              <Button className="w-full" size="sm">
                編集して送信
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
