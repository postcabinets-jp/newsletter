"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPublication, updatePublication } from "@/lib/actions/settings";

export function PublicationForm({
  existing,
}: {
  existing?: { name: string; slug: string; description: string | null } | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !existing;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    if (isNew) {
      const result = await createPublication(formData);
      setPending(false);
      if (result.success) {
        toast.success("パブリケーションを作成しました");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await updatePublication(formData);
      setPending(false);
      if (result.success) {
        toast.success("設定を更新しました");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {isNew && (
        <div className="space-y-1.5">
          <Label className="text-xs">組織名</Label>
          <Input
            name="org_name"
            placeholder="My Company"
            className="text-sm"
            required
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">パブリケーション名</Label>
        <Input
          name="name"
          defaultValue={existing?.name ?? ""}
          placeholder="TechInsider Weekly"
          className="text-sm"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">スラッグ</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">newsletter.vercel.app/</span>
          <Input
            name="slug"
            defaultValue={existing?.slug ?? ""}
            placeholder="my-newsletter"
            className="text-sm"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">概要</Label>
        <Textarea
          name="description"
          defaultValue={existing?.description ?? ""}
          placeholder="ニュースレターの説明..."
          className="text-sm resize-none"
          rows={3}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "保存中..." : isNew ? "パブリケーションを作成" : "変更を保存"}
      </Button>
    </form>
  );
}
