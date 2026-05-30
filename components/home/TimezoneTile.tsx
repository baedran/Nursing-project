"use client";

import { useEffect, useState } from "react";

type Props = {
  city: string;
  tz: string;
};

export default function TimezoneTile({ city, tz }: Props) {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    function update() {
      const t = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
      setTime(t);
    }
    update();
    const id = window.setInterval(update, 30_000); // refresh every 30s
    return () => window.clearInterval(id);
  }, [tz]);

  return (
    <div className="rounded-xl border border-paper/10 bg-paper/[0.05] px-3.5 py-4.5">
      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/55">
        {city}
      </div>
      <div
        className="font-display font-medium text-paper"
        style={{ fontSize: "24px", letterSpacing: "-0.02em" }}
      >
        {time}
      </div>
    </div>
  );
}
