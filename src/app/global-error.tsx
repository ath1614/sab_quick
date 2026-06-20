"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center", background: "#F7F8F9" }}>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#0D0D0D" }}>Something went wrong</p>
          <p style={{ fontSize: 14, color: "#6b7280" }}>{error?.message ? "An unexpected error occurred." : ""}</p>
          <button onClick={reset}
            style={{ background: "#2CA01C", color: "#fff", fontWeight: 700, padding: "14px 32px", borderRadius: 16, border: "none" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
