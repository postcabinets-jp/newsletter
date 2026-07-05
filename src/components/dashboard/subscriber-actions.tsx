"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, Plus, MoreHorizontal, UserMinus, Trash2 } from "lucide-react";
import {
  addSubscriber,
  deleteSubscriber,
  unsubscribe,
  importSubscribersCsv,
  exportSubscribersCsv,
} from "@/lib/actions/subscribers";

export function AddSubscriberButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await addSubscriber(formData);
    setPending(false);
    if (result.success) {
      toast.success("購読者を追加しました");
      setOpen(false);
      formRef.current?.reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4 mr-1.5" />
        購読者を追加
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">購読者を追加</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">メールアドレス *</Label>
            <Input name="email" type="email" required placeholder="user@example.com" className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">姓</Label>
              <Input name="last_name" placeholder="田中" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">名</Label>
              <Input name="first_name" placeholder="太郎" className="text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">流入元</Label>
            <Input name="source" placeholder="manual" className="text-sm" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "追加中..." : "追加"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportCsvButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [csvText, setCsvText] = useState("");

  async function handleImport() {
    if (!csvText.trim()) {
      toast.error("CSVデータを入力してください");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("csv", csvText);
    const result = await importSubscribersCsv(fd);
    setPending(false);
    if (result.success) {
      toast.success(
        `${result.data.imported}件インポート、${result.data.skipped}件スキップ`
      );
      if (result.data.errors.length > 0) {
        toast.warning(`${result.data.errors.length}件のエラー`);
      }
      setOpen(false);
      setCsvText("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Upload className="w-4 h-4 mr-1.5" />
        CSVインポート
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">CSVインポート</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            ヘッダー行: email,first_name,last_name,source
          </p>
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"email,first_name,last_name,source\nuser@example.com,太郎,田中,csv"}
            className="min-h-[200px] text-sm font-mono"
          />
          <Button onClick={handleImport} className="w-full" disabled={pending}>
            {pending ? "インポート中..." : "インポート"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExportCsvButton() {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    const result = await exportSubscribersCsv();
    setPending(false);
    if (result.success) {
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSVをダウンロードしました");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={pending}>
      <Download className="w-4 h-4 mr-1.5" />
      {pending ? "出力中..." : "CSV出力"}
    </Button>
  );
}

export function SubscriberRowActions({ subscriberId, status }: { subscriberId: string; status: string }) {
  const [pending, setPending] = useState(false);

  async function handleUnsubscribe() {
    setPending(true);
    const fd = new FormData();
    fd.set("id", subscriberId);
    const result = await unsubscribe(fd);
    setPending(false);
    if (result.success) {
      toast.success("退会処理を完了しました");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!confirm("この購読者を削除しますか？この操作は取り消せません。")) return;
    setPending(true);
    const fd = new FormData();
    fd.set("id", subscriberId);
    const result = await deleteSubscriber(fd);
    setPending(false);
    if (result.success) {
      toast.success("購読者を削除しました");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pending} />}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "active" && (
          <DropdownMenuItem onClick={handleUnsubscribe}>
            <UserMinus className="w-4 h-4 mr-2" />
            退会処理
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
