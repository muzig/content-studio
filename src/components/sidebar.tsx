"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/hot-topics", label: "热点收集", icon: "🔥" },
  { href: "/create", label: "内容创作", icon: "✍️" },
  { href: "/calendar", label: "发布日历", icon: "📅" },
  { href: "/analytics", label: "数据分析", icon: "📊" },
  { href: "/daily", label: "每日编辑", icon: "📝" },
  { href: "/publish", label: "发布管理", icon: "📋" },
  { href: "/settings", label: "设置", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-primary">Content Studio</h1>
      </div>
      <nav className="flex-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/daily"
              ? pathname.startsWith("/daily")
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href === "/daily" ? `/daily/${todayStr()}` : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
