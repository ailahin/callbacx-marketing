"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-6 shadow-sm dark:border-neutral-800",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-48 w-full flex items-center justify-center">{children}</div>
    </div>
  );
}

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export function BarChart({
  data,
  height = 200,
  color = "#4f46e5",
  showLabels = true,
}: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = 60;
  const gap = 24;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <svg
      width={chartWidth}
      height={height}
      viewBox={`0 0 ${chartWidth} ${height}`}
      className="w-full h-full"
      role="img"
      aria-label="Bar chart"
    >
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barHeight = Math.max((d.value / maxValue) * (height - 40), 4);
        const x = i * (barWidth + gap);
        const y = height - barHeight - 24;
        return (
          <g key={d.name}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill="url(#chartGradient)"
            />
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
                fontWeight="600"
              >
                {d.value}
              </text>
            )}
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
              >
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface LineChartData {
  name: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 200, color = "#4f46e5" }: LineChartProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;
  const padding = 40;
  const chartWidth = data.length * 60;
  const plotHeight = height - padding;

  const points = data.map((d, i) => {
    const x = i * 60 + 30;
    const y = height - 24 - ((d.value - minValue) / range) * plotHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      width={chartWidth}
      height={height}
      viewBox={`0 0 ${chartWidth} ${height}`}
      className="w-full h-full"
      role="img"
      aria-label="Line chart"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${points}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow"
      />
      <path
        d={`M${points}`}
        fill="url(#lineGradient)"
        stroke="none"
      />
      {data.map((d, i) => (
        <circle
          key={d.name}
          cx={i * 60 + 30}
          cy={height - 24 - ((d.value - minValue) / range) * plotHeight}
          r="4"
          fill={color}
          stroke="#ffffff"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
