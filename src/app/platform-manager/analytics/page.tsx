// src/app/platform-manager/analytics/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Period = "Daily" | "Weekly" | "Monthly";

type DataPoint = { label: string; value: number };

function generateData(period: Period): DataPoint[] {
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (period === "Daily") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
      label,
      value: rand(500, 5000),
    }));
  }
  if (period === "Weekly") {
    return ["Week 1", "Week 2", "Week 3", "Week 4"].map((label) => ({
      label,
      value: rand(5000, 25000),
    }));
  }
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label) => ({
    label,
    value: rand(20000, 80000),
  }));
}

const CHART_H = 280;
const CHART_W = 700;
const PAD_LEFT = 72;
const PAD_RIGHT = 24;
const PAD_TOP = 16;
const PAD_BOTTOM = 40;
const INNER_W = CHART_W - PAD_LEFT - PAD_RIGHT;
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM;
const BAR_COLOR = "#16a34a";
const AXIS_COLOR = "#d1d5db";
const TICK_COLOR = "#6b7280";

function BarChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value));
  const nBars = data.length;
  const barGap = INNER_W / nBars;
  const barW = barGap * 0.55;

  const yTicks = 5;
  const step = Math.ceil(max / yTicks / 1000) * 1000 || 1000;
  const yMax = step * yTicks;

  const yPos = (v: number) => PAD_TOP + INNER_H - (v / yMax) * INNER_H;

  function fmtY(v: number) {
    if (v >= 1000) return `$${v / 1000}k`;
    return `$${v}`;
  }

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full"
      style={{ maxHeight: CHART_H }}
    >
      {/* Y-axis gridlines + ticks */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = i * step;
        const y = yPos(v);
        return (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              y1={y}
              x2={CHART_W - PAD_RIGHT}
              y2={y}
              stroke={AXIS_COLOR}
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill={TICK_COLOR}
            >
              {fmtY(v)}
            </text>
          </g>
        );
      })}

      {/* Y-axis label */}
      <text
        x={14}
        y={CHART_H / 2}
        textAnchor="middle"
        fontSize={11}
        fill={TICK_COLOR}
        transform={`rotate(-90, 14, ${CHART_H / 2})`}
      >
        Total Donations (SGD)
      </text>

      {/* Bars */}
      {data.map((d, i) => {
        const x = PAD_LEFT + i * barGap + (barGap - barW) / 2;
        const barH = (d.value / yMax) * INNER_H;
        const y = PAD_TOP + INNER_H - barH;
        const isHovered = hovered === i;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={isHovered ? "#15803d" : BAR_COLOR}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", transition: "fill 0.15s" }}
            />
            {/* Tooltip on hover */}
            {isHovered && (
              <g>
                <rect
                  x={x + barW / 2 - 36}
                  y={y - 28}
                  width={72}
                  height={22}
                  rx={4}
                  fill="#1f2937"
                />
                <text
                  x={x + barW / 2}
                  y={y - 13}
                  textAnchor="middle"
                  fontSize={11}
                  fill="white"
                >
                  ${d.value.toLocaleString()}
                </text>
              </g>
            )}
            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={PAD_TOP + INNER_H + 20}
              textAnchor="middle"
              fontSize={11}
              fill={TICK_COLOR}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* X-axis line */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP + INNER_H}
        x2={CHART_W - PAD_RIGHT}
        y2={PAD_TOP + INNER_H}
        stroke={AXIS_COLOR}
        strokeWidth={1}
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("Monthly");
  const [data, setData] = useState<DataPoint[]>(() => generateData("Monthly"));
  const [toast, setToast] = useState(false);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setData(generateData(p));
  }

  function handleGenerateReport() {
    setData(generateData(period));
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Page heading */}
      <p className="text-sm text-gray-500">Welcome, Platform Manager!</p>
      <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
        Currently Managing
      </h1>

      {/* Tab pills */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => router.push("/platform-manager/categories")}
          className="rounded-full border border-[#18543E] px-5 py-2 text-sm font-semibold text-[#18543E] hover:bg-green-50"
        >
          Fundraising Categories
        </button>
        <button className="rounded-full bg-[#18543E] px-5 py-2 text-sm font-semibold text-white">
          Analytics
        </button>
      </div>

      {/* Chart card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h2 className="text-base font-semibold text-gray-900">
            Donation Analytics —{" "}
            <span className="text-[#18543E]">{period}</span>
          </h2>
        </div>
        <div className="px-4 pb-4 pt-2">
          <BarChart data={data} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#16a34a] focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <button
            onClick={handleGenerateReport}
            className="rounded-lg bg-[#18543E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16a34a]"
          >
            + Generate Report
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-[#18543E] px-5 py-3 text-sm font-medium text-white shadow-lg">
          Report generated!
        </div>
      )}
    </div>
  );
}
