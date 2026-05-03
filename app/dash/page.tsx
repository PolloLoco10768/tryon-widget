"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1 style={{ marginBottom: "20px" }}>📊 Try-On Analytics</h1>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <StatBox label="Try Ons" value={data?.counts?.try_on_clicks || 0} />
        <StatBox label="Saves" value={data?.counts?.save_for_later_clicks || 0} />
        <StatBox label="Uploads" value={data?.counts?.photo_uploads || 0} />
        <StatBox label="Previews" value={data?.counts?.previews_generated || 0} />
      </div>

      {/* Refresh */}
      <button
        onClick={fetchData}
        style={{
          padding: "10px 20px",
          marginBottom: "30px",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>

      {/* Recent Activity */}
      <h2 style={{ marginBottom: "10px" }}>Recent Activity</h2>

      <div
        style={{
          background: "#1a1a1a",
          padding: "15px",
          borderRadius: "10px",
          minHeight: "120px",
        }}
      >
        {data.events.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No activity yet...</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.events.map((e: any, i: number) => (
              <li
                key={i}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #333",
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {formatEvent(e.event)}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {e.product || "No product"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function StatBox({ label, value }: any) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "20px",
        borderRadius: "10px",
        minWidth: "120px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{value}</div>
      <div style={{ opacity: 0.6 }}>{label}</div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatEvent(event: string) {
  switch (event) {
    case "try_on_clicks":
      return "Tried On Item";
    case "save_for_later_clicks":
      return "Saved Item";
    case "photo_uploads":
      return "Uploaded Photo";
    case "previews_generated":
      return "Generated Preview";
    default:
      return event;
  }
}