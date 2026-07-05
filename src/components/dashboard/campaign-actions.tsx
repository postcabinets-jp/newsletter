"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Trash2, Clock, XCircle } from "lucide-react";
import {
  sendCampaignNow,
  deleteCampaign,
  scheduleCampaign,
  cancelScheduledCampaign,
} from "@/lib/actions/campaigns";

export function SendCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSend() {
    if (!confirm("このキャンペーンをすべてのアクティブ購読者に送信しますか？")) return;
    setPending(true);
    const fd = new FormData();
    fd.set("id", campaignId);
    const result = await sendCampaignNow(fd);
    setPending(false);
    if (result.success) {
      toast.success(`${result.data.recipientCount}件の購読者に送信しました`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button className="w-full" size="sm" onClick={handleSend} disabled={pending}>
      <Send className="w-4 h-4 mr-1.5" />
      {pending ? "送信中..." : "今すぐ送信"}
    </Button>
  );
}

export function ScheduleCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sendAt, setSendAt] = useState("");

  async function handleSchedule() {
    if (!sendAt) {
      toast.error("送信日時を選択してください");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("id", campaignId);
    fd.set("send_at", new Date(sendAt).toISOString());
    const result = await scheduleCampaign(fd);
    setPending(false);
    if (result.success) {
      toast.success("スケジュールを設定しました");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-full" size="sm" />}>
        <Clock className="w-4 h-4 mr-1.5" />
        スケジュール送信
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">送信スケジュール</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">送信日時</Label>
            <Input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button onClick={handleSchedule} className="w-full" disabled={pending}>
            {pending ? "設定中..." : "スケジュールを設定"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CancelScheduleButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    if (!confirm("スケジュールをキャンセルして下書きに戻しますか？")) return;
    setPending(true);
    const fd = new FormData();
    fd.set("id", campaignId);
    const result = await cancelScheduledCampaign(fd);
    setPending(false);
    if (result.success) {
      toast.success("スケジュールをキャンセルしました");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button variant="outline" className="w-full" size="sm" onClick={handleCancel} disabled={pending}>
      <XCircle className="w-4 h-4 mr-1.5" />
      {pending ? "キャンセル中..." : "スケジュール解除"}
    </Button>
  );
}

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("この下書きを削除しますか？この操作は取り消せません。")) return;
    setPending(true);
    const fd = new FormData();
    fd.set("id", campaignId);
    const result = await deleteCampaign(fd);
    setPending(false);
    if (result.success) {
      toast.success("キャンペーンを削除しました");
      router.push("/campaigns");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button variant="outline" className="w-full text-red-600 hover:text-red-700" size="sm" onClick={handleDelete} disabled={pending}>
      <Trash2 className="w-4 h-4 mr-1.5" />
      {pending ? "削除中..." : "下書きを削除"}
    </Button>
  );
}
