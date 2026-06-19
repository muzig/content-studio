"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORMS } from "@/lib/types";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold mb-6">设置</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">支持平台</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.value}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm">{p.label}</span>
                <span className="text-xs text-muted-foreground">
                  {p.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">关于</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Content Studio MVP — 每天在一个地方写，一键适配多平台格式，追踪发布状态。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
