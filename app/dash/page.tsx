"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  const loadData = () => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(setData);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: "30px" }}>📊 Try-On Analytics</h1>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px"
      }}>
        {[
          { label: "Try Ons", value: data.counts.try_on_clicks },
          { label: "Saves", value: data.counts.save_for_later_clicks },
          { label: "Uploads", value: data.counts.photo_uploads },
          { label: "Previews", value: data.counts.previews_generated }
        ].map((card, i) => (
          <div key={i} style={{
            background: "#111",
            color: "#fff",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center"
          }}>
            <h2>{card.value || 0}</h2>
            <p>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadData}
        style={{
          marginTop: "30px",
          padding: "10px 20px",
          borderRadius: "6px",
          border: "none",
          background: "#000",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Refresh
      </button>

      {/* Activity Feed */}
      <h2 style={{ marginTop: "40px" }}>Recent Activity</h2>

      <div style={{
        marginTop: "10px",
        background: "#f5f5f5",
        padding: "20px",
        borderRadius: "10px"
      }}>
        {data.events.map((e: any, i: number) => (
          <div key={i} style={{
            padding: "10px 0",
            borderBottom: "1px solid #ddd"
          }}>
            <strong>{e.event}</strong> → {e.product}
          </div>
        ))}
      </div>
    </div>
  );
}