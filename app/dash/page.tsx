"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>📊 Try-On Analytics Dashboard</h1>

      <div style={{ marginTop: "20px", fontSize: "20px" }}>
        <p>Try Ons: {data.counts.try_on_clicks || 0}</p>
        <p>Saves: {data.counts.save_for_later_clicks || 0}</p>
        <p>Uploads: {data.counts.photo_uploads || 0}</p>
        <p>Previews: {data.counts.previews_generated || 0}</p>
      </div>

      <h2 style={{ marginTop: "40px" }}>Recent Activity</h2>

      <ul>
        {data.events.map((e: any, i: number) => (
          <li key={i}>
            {e.event} → {e.product}
          </li>
        ))}
      </ul>
    </div>
  );
}