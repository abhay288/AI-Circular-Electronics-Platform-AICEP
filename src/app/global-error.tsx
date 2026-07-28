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
      <body style={{ backgroundColor: "#04070E", color: "#F5F8FF", fontFamily: "sans-serif", margin: 0, padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", color: "#00E6FF" }}>EcoIntel System Initializing...</h2>
        <p style={{ color: "#8A97B5" }}>{error?.message || "Refreshing telemetry context..."}</p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: "#00E6FF",
            color: "#04070E",
            border: "none",
            borderRadius: "20px",
            padding: "10px 24px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "16px",
          }}
        >
          Reload Console
        </button>
      </body>
    </html>
  );
}
