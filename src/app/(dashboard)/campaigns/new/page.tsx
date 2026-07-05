"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Save } from "lucide-react";
import Link from "next/link";
import { createCampaign, sendCampaignNow } from "@/lib/actions/campaigns";

export default function NewCampaignPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSaveDraft() {
    if (!subject.trim()) {
      toast.error("件名を入力してください");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    fd.set("subject", subject.trim());
    fd.set("preview_text", previewText.trim());
    fd.set("content_html", `<p>${content.replace(/\n/g, "</p><p>")}</p>`);
    fd.set(
      "content_json",
      JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: content }] },
        ],
      })
    );

    const result = await createCampaign(fd);
    setSaving(false);

    if (result.success) {
      toast.success("下書きを保存しました");
      router.push(`/campaigns/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleSendNow() {
    if (!subject.trim()) {
      toast.error("件名を入力してください");
      return;
    }
    if (!content.trim()) {
      toast.error("本文を入力してください");
      return;
    }
    setSending(true);

    // First save as draft
    const fd = new FormData();
    fd.set("subject", subject.trim());
    fd.set("preview_text", previewText.trim());
    fd.set("content_html", `<p>${content.replace(/\n/g, "</p><p>")}</p>`);
    fd.set(
      "content_json",
      JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: content }] },
        ],
      })
    );

    const createResult = await createCampaign(fd);
    if (!createResult.success) {
      toast.error(createResult.error);
      setSending(false);
      return;
    }

    // Then send
    const sendFd = new FormData();
    sendFd.set("id", createResult.data.id);
    const sendResult = await sendCampaignNow(sendFd);
    setSending(false);

    if (sendResult.success) {
      toast.success(`${sendResult.data.recipientCount}件の購読者に送信しました`);
      router.push(`/campaigns/${createResult.data.id}`);
    } else {
      toast.error(sendResult.error);
      // Draft was saved, navigate to it
      router.push(`/campaigns/${createResult.data.id}`);
    }
  }

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
        <h1 className="text-lg font-semibold text-slate-900">新規キャンペーン</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Editor */}
        <div className="col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">メール設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs">件名 *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="今週のTechInsider: AIが変える未来の働き方"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preview" className="text-xs">
                  プレビューテキスト
                  <span className="text-slate-400 ml-1">（受信トレイでの概要表示）</span>
                </Label>
                <Input
                  id="preview"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="GPT-5とClaude 4の徹底比較、実務ユースケース別に解説..."
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">本文</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="edit">
                <TabsList className="h-8 mb-3">
                  <TabsTrigger value="edit" className="text-xs">編集</TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs">プレビュー</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`本文を入力してください。\n\n今週のハイライト...\n\n---\n\nご意見・ご感想はこちらへ返信ください。`}
                    className="min-h-[400px] text-sm font-mono resize-none border-slate-200"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Markdownをサポートしています。**太字** *斜体* # 見出し
                  </p>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[400px] border border-slate-200 rounded-md p-4 bg-white">
                    {content ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: `<p>${content.replace(/\n/g, "</p><p>")}</p>` }}
                      />
                    ) : (
                      <p className="text-slate-400 text-sm">本文を入力するとプレビューが表示されます</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">送信</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                size="sm"
                onClick={handleSendNow}
                disabled={!subject || sending}
              >
                <Send className="w-4 h-4 mr-1.5" />
                {sending ? "送信中..." : "今すぐ送信"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || !subject}
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "保存中..." : "下書きとして保存"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">送信対象</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 text-xs">セグメント</span>
                  <span className="text-xs font-medium">すべてのアクティブ</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                タグ条件でセグメントを絞り込めます
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">A/Bテスト</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">
                件名のA/Bテストを設定して最適な件名を自動判定できます
              </p>
              <Button variant="outline" size="sm" className="mt-2 w-full text-xs" disabled>
                A/Bテストを設定（準備中）
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
