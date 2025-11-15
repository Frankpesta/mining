"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartsData = {
  userGrowth: Array<{ date: string; users: number }>;
  depositTrends: Array<{ date: string; amount: number }>;
  withdrawalTrends: Array<{ date: string; amount: number }>;
};

export function AnalyticsCharts({ charts }: { charts: ChartsData }) {
  // Combine deposit and withdrawal trends
  const transactionTrends = charts.depositTrends.map((deposit, index) => ({
    date: deposit.date,
    deposits: deposit.amount,
    withdrawals: charts.withdrawalTrends[index]?.amount || 0,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Transaction Trends (Last 30 Days)</CardTitle>
          <CardDescription>Deposits vs withdrawals over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="deposits"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Deposits"
              />
              <Line
                type="monotone"
                dataKey="withdrawals"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Withdrawals"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

