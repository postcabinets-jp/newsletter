import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 right-0 left-60 z-30 h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="flex-1" />
      <UserMenu user={user} />
    </header>
  );
}
