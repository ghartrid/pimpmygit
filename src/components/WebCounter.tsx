"use client";

import { useEffect, useState } from "react";

export function WebCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/views", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => {});
  }, []);

  if (count === null) return null;

  const digits = String(count).padStart(7, "0");

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Visitors</span>
      <div className="flex">
        {digits.split("").map((d, i) => (
          <span
            key={i}
            className="inline-block w-5 h-7 text-center text-sm font-mono font-bold leading-7"
            style={{
              background: "#111",
              color: "#4ade80",
              borderRadius: i === 0 ? "4px 0 0 4px" : i === digits.length - 1 ? "0 4px 4px 0" : "0",
              borderRight: i < digits.length - 1 ? "1px solid #222" : "none",
              textShadow: "0 0 6px rgba(74,222,128,0.5)",
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
