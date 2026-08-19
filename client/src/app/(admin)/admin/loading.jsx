import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "0.75rem",
          background: "var(--color-primary, #f49e0b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-coral, 0 4px 16px rgba(244,158,11,0.35))",
        }}
      >
        <Loader2
          size={22}
          style={{
            color: "var(--color-secondary, #572228)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
      <p style={{ color: "#9a7a7e", fontSize: "0.875rem", margin: 0 }}>
        Loading…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
