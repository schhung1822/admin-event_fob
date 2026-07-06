import { BadgeCheck, CircleDollarSign, Percent, Ticket } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardMetrics = {
  registeredTickets: number;
  paidTickets: number;
  estimatedRevenue: number;
  conversionRate: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    {
      description: "Tổng số vé đã được tạo trong hệ thống",
      icon: Ticket,
      label: "Vé đăng ký",
      value: formatNumber(metrics.registeredTickets),
    },
    {
      description: "Chỉ tính các vé có trạng thái paydone",
      icon: BadgeCheck,
      label: "Vé thanh toán",
      value: formatNumber(metrics.paidTickets),
    },
    {
      description: "Tổng tiền từ các vé paydone",
      icon: CircleDollarSign,
      label: "Doanh thu tạm tính",
      value: formatMoney(metrics.estimatedRevenue),
    },
    {
      description: "Vé thanh toán / vé đăng ký",
      icon: Percent,
      label: "Tỷ lệ chuyển đổi",
      value: `${metrics.conversionRate.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>
                <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardTitle>
              <CardDescription>{item.label}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{item.value}</div>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}