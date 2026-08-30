import { Suspense } from "react";
import QueueStudioPage from "./queue-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <QueueStudioPage />
    </Suspense>
  );
}
