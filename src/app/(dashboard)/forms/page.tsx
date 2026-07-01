import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormInput, Plus, TrendingUp } from "lucide-react";
import type { Form } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  inline: "インライン",
  popup: "ポップアップ",
  standalone: "スタンドアロン",
};

export default async function FormsPage() {
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

  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .eq("publication_id", pub.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">オプトインフォーム</h1>
          <p className="text-sm text-slate-500 mt-0.5">購読フォームの管理・埋め込みコード取得</p>
        </div>
        <Button size="sm" disabled>
          <Plus className="w-4 h-4 mr-1.5" />
          新規フォーム
        </Button>
      </div>

      {forms && forms.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {(forms as Form[]).map((form) => {
            const conversionRate =
              form.total_views > 0
                ? ((form.total_signups / form.total_views) * 100).toFixed(1)
                : "0.0";
            return (
              <Card key={form.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{form.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {TYPE_LABELS[form.type] ?? form.type}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-50 rounded-lg">
                      <FormInput className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center bg-slate-50 rounded-md p-2">
                      <p className="text-xs text-slate-400">表示数</p>
                      <p className="text-sm font-bold text-slate-900">{form.total_views.toLocaleString()}</p>
                    </div>
                    <div className="text-center bg-slate-50 rounded-md p-2">
                      <p className="text-xs text-slate-400">登録数</p>
                      <p className="text-sm font-bold text-slate-900">{form.total_signups.toLocaleString()}</p>
                    </div>
                    <div className="text-center bg-emerald-50 rounded-md p-2">
                      <p className="text-xs text-emerald-600">CVR</p>
                      <p className="text-sm font-bold text-emerald-700">{conversionRate}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                      埋め込みコード
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                      編集
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-4">
            <FormInput className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-slate-600 font-medium">フォームがありません</p>
          <p className="text-slate-400 text-sm mt-1">
            購読フォームを作成してサイトに設置しましょう
          </p>
        </div>
      )}
    </div>
  );
}
