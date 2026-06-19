"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  formatted: string;
  onSave: (formatted: string) => void;
  onCopy: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  platform,
  formatted,
  onSave,
  onCopy,
}: PublishDialogProps) {
  const [editValue, setEditValue] = useState(formatted);

  function handleSave() {
    onSave(editValue);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑格式 — {platform}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="min-h-[300px] resize-y"
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCopy}>
            复制内容
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
