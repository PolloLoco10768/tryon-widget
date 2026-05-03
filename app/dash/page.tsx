"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const res = await fetch("/api/analytics");
    const json = await res.json();

    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const counts = data?.counts || {};
  const events = data?.events || [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f5f7",
        color: "#111",
        fontFamily: "Arial, sans-serif",
        padding: "42px",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "34px" }}>
              Try-On Analytics
            </h1>
            <p style={{ marginTop: "8px", color: "#666" }}>
              Live usage data from your virtual fitting room.
            </p>
          </div>

          <button
            onClick={loadData}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#111",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <StatCard title="Try Ons" value={counts.try_on_clicks || 0} />
          <StatCard title="Saves" value={counts.save_for_later_clicks || 0} />
          <StatCard title="Uploads" value={counts.photo_uploads || 0} />
          <StatCard title="Previews" value={counts.previews_generated || 0} />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
            Recent Activity
          </h2>

          {events.length === 0 ? (
            <div
              style={{
                padding: "35px",
                background: "#f7f7f7",
                borderRadius: "16px",
                color: "#777",
                textAlign: "center",
              }}
            >
              No activity yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {events.map((event: any, index: number) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px",
                    border: "1px solid #eee",
                    borderRadius: "14px",
                    background: "#fafafa",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {formatEvent(event.event)}
                    </div>
                    <div style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>
                      {event.product || "No product"} · {event.brand || "No brand"}
                    </div>
                  </div>

                  <div style={{ color: "#999", fontSize: "13px" }}>
                    {formatDate(event.created_at || event.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
      }}
    >
      <div style={{ color: "#777", fontSize: "14px", marginBottom: "10px" }}>
        {title}
      </div>
      <div style={{ fontSize: "38px", fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

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
    case "camera_opens":
      return "Opened Camera";
    case "photos_taken":
      return "Took Photo";
    default:
      return event;
  }
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(date).toLocaleString();
}