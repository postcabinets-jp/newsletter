import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Key, Globe, Mail, Users } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = (await supabase
    .from("organizations")
    .select("*, publications(*)")
    .eq("owner_id", user.id)
    .limit(1)
    .single()) as { data: { id: string; name: string; slug: string; plan: string; created_at: string; updated_at: string; publications: { id: string; name: string; slug: string; description: string | null; custom_domain: string | null; smtp_config: unknown }[] } | null; error: unknown };

  const pub = (org?.publications as { id: string; name: string; slug: string; description: string | null; custom_domain: string | null; smtp_config: unknown }[])?.[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">パブリケーションとアカウントの設定</p>
      </div>

      <div className="space-y-6">
        {/* Publication settings */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              パブリケーション設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">パブリケーション名</Label>
              <Input
                defaultValue={pub?.name ?? ""}
                placeholder="TechInsider Weekly"
                className="text-sm"
                readOnly={!pub}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">スラッグ</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">newsletter.vercel.app/</span>
                <Input
                  defaultValue={pub?.slug ?? ""}
                  placeholder="my-newsletter"
                  className="text-sm"
                  readOnly={!pub}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">概要</Label>
              <Textarea
                defaultValue={pub?.description ?? ""}
                placeholder="ニュースレターの説明..."
                className="text-sm resize-none"
                rows={3}
                readOnly={!pub}
              />
            </div>
            <Button size="sm" disabled>変更を保存</Button>
          </CardContent>
        </Card>

        {/* SMTP */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              メール送信設定（SMTP）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">プロバイダー</Label>
              <select className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white" disabled>
                <option>Resend</option>
                <option>Amazon SES</option>
                <option>Postmark</option>
                <option>カスタムSMTP</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">APIキー / SMTP認証情報</Label>
              <Input
                type="password"
                placeholder="re_xxxxxxxx"
                className="text-sm"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">送信者名</Label>
                <Input placeholder="田中 誠" className="text-sm" disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">送信者メールアドレス</Label>
                <Input placeholder="hello@example.com" className="text-sm" disabled />
              </div>
            </div>
            <Button size="sm" disabled>SMTP設定を保存</Button>
          </CardContent>
        </Card>

        {/* Custom domain */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              カスタムドメイン
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">ドメイン</Label>
              <Input
                defaultValue={pub?.custom_domain ?? ""}
                placeholder="newsletter.yourdomain.com"
                className="text-sm"
                disabled
              />
            </div>
            <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">DNSレコード設定（例）</p>
              <p>CNAME newsletter → cname.vercel-dns.com</p>
            </div>
            <Button size="sm" disabled>ドメインを設定</Button>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4" />
              APIキー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              外部システムからサブスクライバーを管理したり、キャンペーンを自動送信するためのAPIキーです
            </p>
            <Button size="sm" disabled>
              新しいAPIキーを生成
            </Button>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              チームメンバー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {user.user_metadata?.full_name ?? user.email}
                </p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                オーナー
              </span>
            </div>
            <Separator className="my-3" />
            <Button size="sm" variant="outline" disabled>
              メンバーを招待
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
