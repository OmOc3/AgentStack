import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#09090b",
          color: "#fafafa",
          display: "flex",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 56,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: 590,
            }}
          >
            <div
              style={{
                alignItems: "center",
                color: "#a855f7",
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                gap: 14,
                letterSpacing: 0,
              }}
            >
              <span
                style={{
                  background: "#a855f7",
                  borderRadius: 16,
                  display: "flex",
                  height: 28,
                  width: 28,
                }}
              />
              AgentStack
            </div>
            <h1
              style={{
                color: "#ffffff",
                fontSize: 78,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 0.95,
                margin: "34px 0 0",
              }}
            >
              AI-ready repos in seconds.
            </h1>
            <p
              style={{
                color: "#d4d4d8",
                fontSize: 30,
                lineHeight: 1.35,
                margin: "32px 0 0",
              }}
            >
              Pick a stack, connect GitHub, and start with the agent files
              already in place.
            </p>
          </div>

          <div
            style={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 28,
              boxShadow: "0 30px 80px rgba(168, 85, 247, 0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              width: 410,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#27272a",
                display: "flex",
                gap: 10,
                height: 56,
                padding: "0 24px",
              }}
            >
              {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
                <span
                  key={color}
                  style={{
                    background: color,
                    borderRadius: 999,
                    display: "flex",
                    height: 13,
                    width: 13,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                padding: 32,
              }}
            >
              {["CLAUDE.md", "AGENT.md", ".cursorrules"].map((file) => (
                <div
                  key={file}
                  style={{
                    alignItems: "center",
                    background: "#09090b",
                    border: "1px solid #3f3f46",
                    borderRadius: 14,
                    color: "#e4e4e7",
                    display: "flex",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 25,
                    gap: 16,
                    padding: "18px 20px",
                  }}
                >
                  <span
                    style={{
                      color: "#a855f7",
                      display: "flex",
                      fontWeight: 700,
                    }}
                  >
                    +
                  </span>
                  {file}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    },
  );
}
