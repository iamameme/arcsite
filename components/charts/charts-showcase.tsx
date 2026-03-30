"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const weeklySignups = [
  { day: "Mon", signups: 14, qualified: 7 },
  { day: "Tue", signups: 18, qualified: 10 },
  { day: "Wed", signups: 16, qualified: 9 },
  { day: "Thu", signups: 27, qualified: 15 },
  { day: "Fri", signups: 21, qualified: 13 },
  { day: "Sat", signups: 11, qualified: 6 },
  { day: "Sun", signups: 9, qualified: 4 },
];

const revenueTrend = [
  { month: "Jan", revenue: 2400, cost: 1400 },
  { month: "Feb", revenue: 2100, cost: 1200 },
  { month: "Mar", revenue: 2900, cost: 1600 },
  { month: "Apr", revenue: 3200, cost: 1700 },
  { month: "May", revenue: 3500, cost: 1900 },
  { month: "Jun", revenue: 4100, cost: 2200 },
];

const trafficChannels = [
  { name: "Organic", value: 44 },
  { name: "Direct", value: 21 },
  { name: "Social", value: 18 },
  { name: "Referral", value: 17 },
];

const channelColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ChartsShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and cost for the first 6 months.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend} margin={{ left: 12, right: 12, top: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Signups</CardTitle>
          <CardDescription>Signups and qualified leads by day.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySignups} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="signups" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="qualified" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Mix</CardTitle>
          <CardDescription>Session source split for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={trafficChannels} dataKey="value" nameKey="name" outerRadius={90}>
                {trafficChannels.map((entry, index) => (
                  <Cell key={entry.name} fill={channelColors[index % channelColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
