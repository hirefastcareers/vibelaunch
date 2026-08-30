"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  FileText,
  Video,
  RefreshCw,
  ListOrdered,
  LayoutDashboard,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const run = useCallback(
    (action: () => void) => {
      action();
      onOpenChange(false);
      setSearch("");
    },
    [onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b px-3">
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions">
              <Command.Item
                onSelect={() => run(() => router.push("/dashboard/queue?generate=true"))}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <FileText className="h-4 w-4" />
                Draft X Thread
              </Command.Item>
              <Command.Item
                onSelect={() => run(async () => {
                  await fetch("/api/media/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "video", url: window.location.origin }),
                  });
                  router.push("/dashboard/queue");
                })}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <Video className="h-4 w-4" />
                Record Site Video
              </Command.Item>
              <Command.Item
                onSelect={() => run(async () => {
                  await fetch("/api/cron/analytics", { method: "POST" });
                })}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <RefreshCw className="h-4 w-4" />
                Trigger SEO Sync
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigate">
              <Command.Item
                onSelect={() => run(() => router.push("/dashboard"))}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                Command Center
              </Command.Item>
              <Command.Item
                onSelect={() => run(() => router.push("/dashboard/queue"))}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <ListOrdered className="h-4 w-4" />
                Navigate to Queue
              </Command.Item>
              <Command.Item
                onSelect={() => run(() => router.push("/dashboard/replies"))}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <MessageSquare className="h-4 w-4" />
                Smart Replies
              </Command.Item>
              <Command.Item
                onSelect={() => run(() => router.push("/onboard"))}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <Rocket className="h-4 w-4" />
                Onboard Project
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
