"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShipUpdateModal } from "@/components/ship-update-modal";

export function ShipUpdateLauncher({
  projects,
}: {
  projects: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("ship") === "true") {
      setOpen(true);
    }
  }, [searchParams]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get("ship") === "true") {
      router.replace("/dashboard");
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={!projects.length}>
        Ship update
      </Button>
      <ShipUpdateModal
        open={open}
        onOpenChange={handleOpenChange}
        projects={projects}
        onShipped={() => router.refresh()}
      />
    </>
  );
}
