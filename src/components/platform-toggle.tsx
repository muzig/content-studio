"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLATFORMS, type Platform } from "@/lib/types";

interface PlatformToggleProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformToggle({ selected, onChange }: PlatformToggleProps) {
  function toggle(platform: Platform) {
    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {PLATFORMS.map((p) => (
        <Badge
          key={p.value}
          variant={selected.includes(p.value) ? "default" : "outline"}
          className={cn(
            "cursor-pointer select-none transition-colors",
            selected.includes(p.value)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          )}
          onClick={() => toggle(p.value)}
        >
          {p.label}
        </Badge>
      ))}
    </div>
  );
}
