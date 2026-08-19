"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("[Admin error]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#f2edee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        <AlertCircle size={26} color="#4e1f24" />
      </div>
      <h2
        style={{
          fontWeight: 800,
          fontSize: "1.25rem",
          color: "#301316",
          margin: "0 0 0.5rem",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: "#754a4f",
          maxWidth: "360px",
          margin: "0 auto 1.75rem",
          fontSize: "0.9rem",
          lineHeight: 1.6,
        }}
      >
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--color-primary, #f49e0b)",
          color: "var(--color-secondary, #572228)",
          border: "none",
          borderRadius: "var(--radius, 0.625rem)",
          padding: "0.625rem 1.5rem",
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}
