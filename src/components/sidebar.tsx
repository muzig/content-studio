"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Sparkles,
  CalendarDays,
  BarChart3,
  Settings,
  MoreHorizontal,
} from "lucide-react";

// Core workflow: 热点 → 创作 → 日历
const NAV_ITEMS = [
  { href: "/hot-topics", label: "热点收集", icon: Flame },
  { href: "/create", label: "内容创作", icon: Sparkles },
  { href: "/calendar", label: "发布日历", icon: CalendarDays },
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

// Bottom nav: 3 core items + "更多"
const BOTTOM_NAV_ITEMS = [
  { href: "/hot-topics", label: "热点", icon: Flame },
  { href: "/create", label: "创作", icon: Sparkles },
  { href: "/calendar", label: "日历", icon: CalendarDays },
];

const MORE_ITEMS = [
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Close drawer on route change
  useEffect(() => {
    closeMore();
  }, [pathname, closeMore]);

  // Lock body scroll when more drawer is open
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-primary">Content Studio</h1>
        </div>
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] py-1.5 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:bg-accent"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] py-1.5 transition-colors",
              MORE_ITEMS.some((i) => isActive(i.href))
                ? "text-primary"
                : "text-muted-foreground active:bg-accent"
            )}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" />
            <span className="text-[10px] leading-tight">更多</span>
          </button>
        </div>
      </nav>

      {/* "更多" drawer */}
      {moreOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[60] bg-black/50"
            onClick={closeMore}
          />
          <div
            className="lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-card border-t border-border rounded-t-xl shadow-xl animate-in slide-in-from-bottom-full"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center py-2">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="px-4 pb-2">
              <p className="text-sm font-medium text-foreground mb-2">更多功能</p>
            </div>
            <nav className="px-2 pb-4">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground active:bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
