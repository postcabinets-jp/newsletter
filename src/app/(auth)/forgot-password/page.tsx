"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/update-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 rounded-lg mb-4">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.18V11c0 3.84-2.63 7.44-6 8.77C8.63 18.44 6 14.84 6 11V7.18L12 5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">パスワードをリセット</h1>
          <p className="text-sm text-slate-500 mt-1">
            登録メールアドレスにリセットリンクを送ります
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-medium">メールを送信しました</p>
              <p className="text-green-700 text-xs mt-1">
                {email} のメールボックスを確認してください。
                数分以内にリセットリンクが届きます。
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">ログインに戻る</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "送信中..." : "リセットリンクを送信"}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900">
                ログインに戻る
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
