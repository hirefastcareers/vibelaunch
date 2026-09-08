"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo,
}: {
  projectId: string;
  projectName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not delete project");
        return;
      }
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {projectName}?</DialogTitle>
            <DialogDescription>
              This removes the project and its drafts, articles, and analytics from Xoopa. Posts
              already live on X stay on X.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete project"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
