"use client";

import { format, parseISO } from "date-fns";
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type DailyDashboardPoint = {
  date: string;
  registeredTickets: number;
  paidTickets: number;
  revenue: number;
};

const chartConfig = {
  registeredTickets: {
    label: "Vé đăng ký",
    color: "var(--chart-1)",
  },
  paidTickets: {
    label: "Vé thanh toán",
    color: "var(--chart-2)",
  },
  revenue: {
    label: "Doanh thu",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: value >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function PerformanceOverview({ data }: { data: DailyDashboardPoint[] }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Thống kê vé theo ngày</CardTitle>
        <CardDescription>
          Vé đăng ký tính theo ngày tạo. Vé thanh toán và doanh thu tính theo ngày thanh toán.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-96 w-full">
          <ComposedChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="fillRegisteredTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-registeredTickets)" stopOpacity={0.36} />
                <stop offset="95%" stopColor="var(--color-registeredTickets)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="fillPaidTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-paidTickets)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-paidTickets)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                parseISO(value).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
            />
            <YAxis
              yAxisId="tickets"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={36}
            />
            <YAxis
              yAxisId="revenue"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={58}
              tickFormatter={(value) => formatMoney(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-56"
                  indicator="line"
                  labelFormatter={(value) => format(parseISO(String(value)), "dd/MM/yyyy")}
                  formatter={(value, name) => {
                    const label = chartConfig[name as keyof typeof chartConfig]?.label ?? name;
                    const formattedValue =
                      name === "revenue"
                        ? new Intl.NumberFormat("vi-VN", {
                            currency: "VND",
                            maximumFractionDigits: 0,
                            style: "currency",
                          }).format(Number(value || 0))
                        : new Intl.NumberFormat("vi-VN").format(Number(value || 0));

                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">{formattedValue}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
            <Area
              yAxisId="tickets"
              dataKey="registeredTickets"
              type="natural"
              fill="url(#fillRegisteredTickets)"
              stroke="var(--color-registeredTickets)"
              strokeWidth={1.5}
              dot={false}
              fillOpacity={1}
            />
            <Area
              yAxisId="tickets"
              dataKey="paidTickets"
              type="natural"
              fill="url(#fillPaidTickets)"
              stroke="var(--color-paidTickets)"
              strokeWidth={1.5}
              dot={false}
              fillOpacity={1}
            />
            <Area
              yAxisId="revenue"
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={1.5}
              dot={false}
              fillOpacity={1}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}