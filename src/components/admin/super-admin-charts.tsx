"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

// Validated categorical steps (dark mode) from the dataviz skill's reference
// palette, re-checked against this app's dark surface (#0d0714): worst
// adjacent CVD deltaE 8.4, worst adjacent normal-vision deltaE 19.3.
const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

export function DepositsWithdrawalsChart({ data }: { data: { day: string; deposits: number; withdrawals: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          formatter={(value) => formatMoney(Number(value))}
          labelFormatter={(d) => new Date(String(d)).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Bar dataKey="deposits" name="Deposits" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="withdrawals" name="Withdrawals" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopGamesChart({ data }: { data: { title: string; turnover: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No gameplay turnover recorded yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
        <Pie
          data={data}
          dataKey="turnover"
          nameKey="title"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.title} fill={SERIES[i % SERIES.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatMoney(Number(value))}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
