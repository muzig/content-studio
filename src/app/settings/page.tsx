"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RotateCcw, Settings } from "lucide-react";

interface PlatformRule {
  id: string;
  platform: string;
  label: string;
  style: string;
  structure: string;
  constraints: string;
  is_preset: boolean;
}

export default function SettingsPage() {
  const [rules, setRules] = useState<PlatformRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("tweets");
  const [editingRule, setEditingRule] = useState<PlatformRule | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-rules");
      const data = await res.json();
      setRules(data.rules || []);
      if (data.rules?.length > 0 && !editingRule) {
        setEditingRule(data.rules[0]);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  }, [editingRule]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function handleTabChange(platform: string) {
    setActiveTab(platform);
    const rule = rules.find((r) => r.platform === platform);
    if (rule) {
      setEditingRule(rule);
    }
  }

  async function handleSave() {
    if (!editingRule) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/platform-rules/${editingRule.platform}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: editingRule.style,
          structure: editingRule.structure,
          constraints: editingRule.constraints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) =>
          prev.map((r) =>
            r.platform === editingRule.platform ? data.rule : r
          )
        );
      }
    } catch (error) {
      console.error("Error saving rule:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(platform: string) {
    try {
      const res = await fetch(`/api/platform-rules/${platform}/reset`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.platform === platform ? data.rule : r))
        );
        if (editingRule?.platform === platform) {
          setEditingRule(data.rule);
        }
      }
    } catch (error) {
      console.error("Error resetting rule:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        设置
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">平台规则管理</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              {rules.map((rule) => (
                <TabsTrigger key={rule.platform} value={rule.platform}>
                  {rule.label}
                  {!rule.is_preset && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      已修改
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {rules.map((rule) => (
              <TabsContent key={rule.platform} value={rule.platform}>
                {editingRule?.platform === rule.platform && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        风格描述
                      </label>
                      <Textarea
                        value={editingRule.style}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            style: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        内容结构
                      </label>
                      <Textarea
                        value={editingRule.structure}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            structure: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        约束条件 (JSON)
                      </label>
                      <Input
                        value={editingRule.constraints}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            constraints: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "保存中..." : "保存修改"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReset(rule.platform)}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        重置为默认
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">关于</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Content Studio V2 — 热点驱动的内容创作与发布管理平台。
            支持热点收集、AI 内容生成、多平台适配、日历排期和数据分析。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
