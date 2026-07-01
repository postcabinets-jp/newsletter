"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Mail,
  Zap,
  FormInput,
  BarChart3,
  CreditCard,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/subscribers", label: "購読者", icon: Users },
  { href: "/campaigns", label: "キャンペーン", icon: Mail },
  { href: "/automations", label: "オートメーション", icon: Zap },
  { href: "/forms", label: "フォーム", icon: FormInput },
  { href: "/analytics", label: "アナリティクス", icon: BarChart3 },
  { href: "/monetization", label: "マネタイズ", icon: CreditCard },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-200">
        <div className="flex items-center justify-center w-7 h-7 bg-slate-900 rounded-md shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
        <span className="font-semibold text-slate-900 text-sm">Newsletter</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {isActive && (
                    <ChevronRight className="w-3 h-3 ml-auto text-slate-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          Newsletter v1.0.0
        </p>
      </div>
    </aside>
  );
}
