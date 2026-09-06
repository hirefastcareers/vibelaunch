"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    const message = error.message ?? "";
    if (
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
        message,
      )
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="ds-kicker">Something went wrong</p>
      <h1 className="mt-3 max-w-[18ch] text-[32px] md:text-[40px]">
        The page hit a snag. Try again.
      </h1>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="ds-btn" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="ds-btn-secondary">
          Home
        </Link>
      </div>
    </main>
  );
}
