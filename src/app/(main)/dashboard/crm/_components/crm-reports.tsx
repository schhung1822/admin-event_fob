"use client";

import { ArrowUpRight, BadgeCheck, CircleDollarSign, Ellipsis, Gift, Percent, Target, Ticket, UserCheck, Users } from "lucide-react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Label, LabelList, type LabelProps, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type CrmMetricData = {
  registeredTickets: number;
  paidTickets: number;
  revenue: number;
  conversionRate: number;
  customers: number;
  giftTickets: number;
  checkins: number;
  checkinRate: number;
  ticketGoal: number;
  ticketGoalProgress: number;
};

export type CrmDailyPoint = {
  date: string;
  registeredTickets: number;
  paidTickets: number;
};

export type CrmDimensionPoint = {
  label: string;
  value: number;
};

export type CrmSourcePoint = {
  label: string;
  registeredTickets: number;
  paidTickets: number;
  revenue: number;
};

export type CrmTicketClassPoint = CrmDimensionPoint & {
  paidTickets: number;
  revenue: number;
  giftTickets: number;
};

export type CrmReportData = {
  metrics: CrmMetricData;
  dailyTickets: CrmDailyPoint[];
  gender: CrmDimensionPoint[];
  careers: CrmDimensionPoint[];
  brands: CrmDimensionPoint[];
  sources: CrmSourcePoint[];
  trafficSources: CrmDimensionPoint[];
  ticketClasses: CrmTicketClassPoint[];
};

const dailyChartConfig = {
  registeredTickets: { label: "V\u00e9 \u0111\u0103ng k\u00fd", color: "var(--foreground)" },
  paidTickets: { label: "V\u00e9 thanh to\u00e1n", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const dimensionChartConfig = {
  value: { label: "Số lượng", color: "var(--chart-1)" },
} satisfies ChartConfig;

const trafficChartConfig = {
  share: { label: "Traffic", color: "var(--chart-1)" },
} satisfies ChartConfig;

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    notation: value >= 100000000 ? "compact" : "standard",
    style: "currency",
  }).format(value || 0);
}

function formatMoneyFull(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

function getPercent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function formatDateTick(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function renderTrafficValueLabel(props: LabelProps) {
  const { height, value, y } = props;

  return (
    <text
      className="fill-foreground"
      dominantBaseline="middle"
      dx={-6}
      fontSize={13}
      textAnchor="end"
      x="100%"
      y={Number(y) + Number(height) / 2}
    >
      {value}
    </text>
  );
}

function OverviewStrip({ data }: { data: CrmReportData }) {
  const { metrics } = data;
  const kpis = [
    { icon: CircleDollarSign, label: "Doanh s\u1ed1", value: formatMoney(metrics.revenue), hint: "Vé thanh toán" },
    { icon: Ticket, label: "V\u00e9 \u0111\u0103ng k\u00fd", value: formatNumber(metrics.registeredTickets), hint: "Tổng vé đăng ký" },
    { icon: Users, label: "Kh\u00e1ch h\u00e0ng", value: formatNumber(metrics.customers), hint: "Tổng khách hàng" },
    { icon: BadgeCheck, label: "V\u00e9 thanh to\u00e1n", value: formatNumber(metrics.paidTickets), hint: "Trạng thái paydone" },
    { icon: Gift, label: "V\u00e9 t\u1eb7ng", value: formatNumber(metrics.giftTickets), hint: "Vé tặng thêm trên CRM" },
    { icon: Percent, label: "T\u1ef7 l\u1ec7 chuy\u1ec3n \u0111\u1ed5i", value: `${metrics.conversionRate.toFixed(1)}%`, hint: "Thanh to\u00e1n / \u0111\u0103ng k\u00fd" },
  ];

  return (
    <div className="h-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 xl:col-span-12">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
          {kpis.map((item, index) => {
            const Icon = item.icon;
            const borderClass = [0, 2, 4].includes(index) ? "md:border-r" : "";
            const bottomClass = index < 4 ? "border-b" : index === 4 ? "border-b md:border-b-0" : "";

            return (
              <Card key={item.label} className={`h-full rounded-none border-0 border-border ${bottomClass} ${borderClass} ring-0`}>
                <CardHeader>
                  <CardTitle className="font-normal text-sm">{item.label}</CardTitle>
                  <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                    {item.value}
                  </CardDescription>
                  <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                    <Icon className="size-3 text-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-sm">{item.hint}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
          <CardHeader>
            <CardTitle className="font-normal">{"V\u00e9 \u0111\u0103ng k\u00fd & thanh to\u00e1n theo ng\u00e0y"}</CardTitle>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dailyChartConfig} className="h-74 w-full">
              <ComposedChart accessibilityLayer data={data.dailyTickets} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
                <defs>
                  <filter id="crm-sales-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="var(--color-registeredTickets)" floodOpacity="0.35" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid yAxisId="paid" vertical={false} />
                <XAxis dataKey="date" axisLine={false} minTickGap={28} tickLine={false} tickMargin={8} tickFormatter={formatDateTick} />
                <YAxis yAxisId="registered" hide allowDecimals={false} />
                <YAxis yAxisId="paid" hide allowDecimals={false} />
                <ChartTooltip cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
                <Bar yAxisId="paid" barSize={8} dataKey="paidTickets" fill="var(--color-paidTickets)" name="Vé thanh toán" opacity={0.22} radius={[6, 6, 0, 0]} />
                <Area yAxisId="registered" dataKey="registeredTickets" fill="none" filter="url(#crm-sales-line-glow)" name="Vé đăng ký" stroke="var(--color-registeredTickets)" strokeWidth={1.8} type="linear" dot={false} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TicketClassProducts({ data }: { data: CrmTicketClassPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">{"Th\u1ed1ng k\u00ea H\u1ea1ng v\u00e9"}</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {formatNumber(total)} {"v\u00e9 tr\u00ean t\u1ea5t c\u1ea3 h\u1ea1ng v\u00e9"}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div aria-label="Ticket share by class" className="flex h-2 gap-1 overflow-hidden bg-muted" role="img">
            {data.map((item, index) => (
              <div
                key={item.label}
                className="rounded-md"
                style={{ backgroundColor: palette[index % palette.length], width: `${getPercent(item.value, total)}%` }}
              />
            ))}
          </div>
          <div className="flex max-h-16 flex-wrap gap-x-4 gap-y-2 overflow-y-auto pr-1">
            {data.map((item, index) => (
              <div className="flex items-center gap-1" key={item.label}>
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                <span className="text-muted-foreground text-xs">
                  {item.label} ({getPercent(item.value, total).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
          <div className="text-muted-foreground text-xs">{"H\u1ea1ng v\u00e9"}</div>
          <div className="text-muted-foreground text-xs">{"V\u00e9 b\u00e1n"}</div>
          <div className="text-muted-foreground text-xs">{"Doanh s\u1ed1"}</div>
          {data.map((item) => (
            <div className="contents text-sm" key={item.label}>
              <div className="min-w-0">
                <div className="truncate font-medium">{item.label}</div>
                <div className="text-muted-foreground text-xs">
                  {formatNumber(item.value)} {"t\u1ed5ng"} · {formatNumber(item.giftTickets)} {"t\u1eb7ng"}
                </div>
              </div>
              <div className="self-center text-muted-foreground tabular-nums">{formatNumber(item.paidTickets)}</div>
              <div className="self-center font-medium tabular-nums">{formatMoney(item.revenue)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
function GoalInventory({ metrics }: { metrics: CrmMetricData }) {
  const paidSegments = Math.min(32, Math.round((metrics.paidTickets / metrics.ticketGoal) * 32));
  const checkinSegments = Math.min(32 - paidSegments, Math.round((metrics.checkins / metrics.ticketGoal) * 32));
  const gaugeSegments = Array.from({ length: 32 }, (_, index) => ({
    id: `segment-${index}`,
    value: 1,
    fill: index < paidSegments ? "var(--chart-2)" : index < paidSegments + checkinSegments ? "var(--chart-1)" : "var(--muted)",
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">{"M\u1ee5c ti\u00eau 1000 v\u00e9"}</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {metrics.ticketGoalProgress.toFixed(1)}% {"ho\u00e0n th\u00e0nh"}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={dimensionChartConfig} className="mx-auto h-30 w-full">
          <PieChart>
            <Pie cx="50%" cy="100%" cornerRadius={6} data={gaugeSegments} dataKey="value" endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={2} startAngle={180} stroke="var(--card)" strokeWidth={1}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan className="fill-foreground font-medium text-2xl tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 22}>
                          {metrics.ticketGoalProgress.toFixed(1)}%
                        </tspan>
                        <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 38}>
                          Mục tiêu
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <Separator />
        <div className="grid grid-cols-3 divide-x">
          {[
            { icon: BadgeCheck, label: "Thanh toán", value: metrics.paidTickets },
            { icon: UserCheck, label: "Check-in", value: metrics.checkins },
            { icon: Target, label: "C\u00f2n l\u1ea1i", value: Math.max(metrics.ticketGoal - metrics.paidTickets, 0) },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-3 text-center">
                <div className="grid size-9 place-items-center rounded-full bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs leading-none">{item.label}</div>
                  <div className="font-medium text-sm tabular-nums">{formatNumber(item.value)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RefPerformance({ data }: { data: CrmSourcePoint[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">{"Nguồn Affiliate"}</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8" />
              <TableHead className="h-8 w-24 text-right font-normal">{"\u0110\u0103ng k\u00fd"}</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">{"B\u00e1n ra"}</TableHead>
              <TableHead className="h-8 w-28 text-right font-normal">{"Doanh s\u1ed1"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {data.map((item) => (
              <TableRow className="hover:bg-transparent" key={item.label}>
                <TableCell className="max-w-0 truncate py-4 font-medium">{item.label}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(item.registeredTickets)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">{formatNumber(item.paidTickets)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(item.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TrafficSources({ data }: { data: CrmDimensionPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({
    label: formatNumber(item.value),
    source: item.label,
    share: Math.max(getPercent(item.value, total), item.value > 0 ? 4 : 0),
    value: item.value,
  }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Nguồn Traffic</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">{"Dữ liệu thống kê theo nguồn khách hàng truy cập website đăng ký vé."}</CardDescription>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <ChartContainer config={trafficChartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0, right: 48 }}>
            <CartesianGrid horizontal={false} vertical={false} />
            <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
            <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar barSize={36} dataKey="share" fill="var(--color-share)" fillOpacity={0.5} radius={8}>
              <LabelList className="fill-foreground" dataKey="source" fontSize={13} offset={12} position="insideLeft" />
              <LabelList content={renderTrafficValueLabel} dataKey="label" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function GenderAllocationCard({ data }: { data: CrmDimensionPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    fill: palette[index % palette.length],
    percentage: getPercent(item.value, total),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">{"Giới tính"}</CardTitle>
        <CardAction className="text-muted-foreground text-xs">Giới tính khách hàng</CardAction>
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <ChartContainer config={dimensionChartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="w-44" nameKey="label" />} />
            <Pie
              cornerRadius={6}
              data={chartData}
              dataKey="value"
              innerRadius={65}
              nameKey="label"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                        Tổng
                      </tspan>
                      <tspan
                        className="fill-foreground font-heading font-medium text-lg tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                      >
                        {formatNumber(total)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {chartData.map((item) => (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={item.label}>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="h-2 w-1 rounded-full" style={{ backgroundColor: item.fill }} />
                  <p className="truncate text-muted-foreground text-xs">{item.label}</p>
                </div>
                <p className="font-medium tabular-nums">{formatNumber(item.value)}</p>
              </div>
              <div className="font-medium tabular-nums">{item.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
function SegmentListCard({ data, description, title }: { data: CrmDimensionPoint[]; description: string; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-h-120 gap-3 overflow-y-auto pr-1">
          {data.map((item, index) => (
            <div key={`${item.label}-${index}`} className="grid gap-1.5 rounded-lg border bg-muted/15 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate font-medium">{item.label}</div>
                <div className="shrink-0 text-muted-foreground tabular-nums">
                  {formatNumber(item.value)} · {getPercent(item.value, total).toFixed(1)}%
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${getPercent(item.value, maxValue)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CrmReports({ data }: { data: CrmReportData }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <OverviewStrip data={data} />
      <div className="grid gap-4 xl:grid-cols-3">
        <TicketClassProducts data={data.ticketClasses} />
        <GoalInventory metrics={data.metrics} />
        <GenderAllocationCard data={data.gender} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RefPerformance data={data.sources} />
        <TrafficSources data={data.trafficSources} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SegmentListCard
          title="Thống kê theo nghề nghiệp"
          description="Dữ liệu thống kê theo thông tin nghề nghiệp mà khách hàng để lại khi đăng ký khi mua vé"
          data={data.careers}
        />
        <SegmentListCard
          title="Doanh nghiệp / Thương hiệu"
          description="Dữ liệu thống kê theo thông tin doanh nghiệp / thương hiệu mà khách hàng để lại khi đăng ký khi mua vé"
          data={data.brands}
        />
      </div>
    </div>
  );
}
