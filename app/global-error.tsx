"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1rem",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            backgroundColor: "#fff",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.5rem",
                backgroundColor: "#745DF3",
                color: "white",
                borderRadius: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
