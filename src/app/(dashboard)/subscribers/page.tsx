import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Upload, Download } from "lucide-react";
import type { Subscriber } from "@/types/database";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "アクティブ", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  unsubscribed: { label: "退会", className: "bg-slate-100 text-slate-500 border-slate-200" },
  bounced: { label: "バウンス", className: "bg-red-50 text-red-600 border-red-200" },
  complained: { label: "スパム報告", className: "bg-orange-50 text-orange-600 border-orange-200" },
  pending: { label: "確認待ち", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q, status } = await searchParams;

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
        <Link href="/settings"><Button className="mt-3">設定へ</Button></Link>
      </div>
    );
  }

  let query = supabase
    .from("subscribers")
    .select("*, subscriber_tags(tag_id, tags(name, color))", { count: "exact" })
    .eq("publication_id", pub.id)
    .order("subscribed_at", { ascending: false })
    .limit(50);

  if (q) query = query.ilike("email", `%${q}%`);
  if (status) query = query.eq("status", status as "active" | "unsubscribed" | "bounced" | "complained" | "pending");

  const { data: subscribers, count } = await query;

  // Status counts
  const statusCounts = await Promise.all(
    ["active", "unsubscribed", "bounced", "complained"].map(async (s) => {
      const { count: c } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("publication_id", pub.id)
        .eq("status", s as "active" | "unsubscribed" | "bounced" | "complained" | "pending");
      return { status: s, count: c ?? 0 };
    })
  );

  const totalActive = statusCounts.find((s) => s.status === "active")?.count ?? 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">購読者</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            合計 {count ?? 0} 件 · アクティブ {totalActive} 件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            CSV出力
          </Button>
          <Button size="sm">
            <Upload className="w-4 h-4 mr-1.5" />
            CSVインポート
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Link href="/subscribers">
          <Badge
            variant={!status ? "default" : "outline"}
            className="cursor-pointer text-xs"
          >
            すべて ({count ?? 0})
          </Badge>
        </Link>
        {statusCounts.map(({ status: s, count: c }) => (
          <Link key={s} href={`/subscribers?status=${s}`}>
            <Badge
              variant={status === s ? "default" : "outline"}
              className="cursor-pointer text-xs"
            >
              {STATUS_LABELS[s]?.label} ({c})
            </Badge>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <form method="GET" className="flex items-center gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="メールアドレスで検索..."
              className="max-w-xs h-8 text-sm"
            />
            <Button type="submit" size="sm" variant="outline">検索</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {subscribers && subscribers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs text-slate-500">メールアドレス</TableHead>
                  <TableHead className="text-xs text-slate-500">名前</TableHead>
                  <TableHead className="text-xs text-slate-500">ステータス</TableHead>
                  <TableHead className="text-xs text-slate-500">流入元</TableHead>
                  <TableHead className="text-xs text-slate-500">登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subscribers as unknown as (Subscriber & { subscriber_tags?: { tags: { name: string; color: string } | null }[] })[]).map((sub) => {
                  const { label, className } = STATUS_LABELS[sub.status] ?? {
                    label: sub.status,
                    className: "bg-slate-100 text-slate-500",
                  };
                  return (
                    <TableRow key={sub.id} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="font-medium text-sm">{sub.email}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {sub.first_name || sub.last_name
                          ? `${sub.first_name ?? ""} ${sub.last_name ?? ""}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
                        >
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {sub.source ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(sub.subscribed_at).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">購読者がいません</p>
              <p className="text-xs text-slate-400 mt-1">
                フォームを設置してサブスクリプションを開始しましょう
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
