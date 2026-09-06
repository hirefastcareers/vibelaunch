"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#242424",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>
          Xoopa hit a snag
        </h1>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 24,
            border: 0,
            borderRadius: 12,
            background: "#242424",
            color: "#fff",
            padding: "12px 20px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
