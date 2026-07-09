"use client";

import { format, parseISO } from "date-fns";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

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
    color: "#facc15",
  },
  paidTickets: {
    label: "Vé thanh toán",
    color: "#2563eb",
  },
  revenue: {
    label: "Doanh thu",
    color: "#22c55e",
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
          Đường xanh: vé thanh toán. Đường vàng: vé đăng ký. Cột thể hiện doanh thu theo ngày thanh toán.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-96 w-full">
          <ComposedChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
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
                        <span className="font-medium font-mono text-foreground tabular-nums">{formattedValue}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="var(--color-revenue)"
              fillOpacity={0.72}
              radius={[4, 4, 0, 0]}
              maxBarSize={42}
            />
            <Line
              yAxisId="tickets"
              dataKey="paidTickets"
              type="monotone"
              stroke="var(--color-paidTickets)"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="tickets"
              dataKey="registeredTickets"
              type="monotone"
              stroke="var(--color-registeredTickets)"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
