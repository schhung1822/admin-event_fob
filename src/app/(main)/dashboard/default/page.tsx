import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

import { type DashboardMetrics, MetricCards } from "./_components/metric-cards";
import { type DailyDashboardPoint, PerformanceOverview } from "./_components/performance-overview";
import { type TicketClassStat, TicketClassStatsTable } from "./_components/ticket-class-stats-table";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MetricDbRow = RowDataPacket & {
  registeredTickets: string | number | null;
  paidTickets: string | number | null;
  estimatedRevenue: string | number | null;
};

type RegisteredDailyDbRow = RowDataPacket & {
  date: string;
  registeredTickets: string | number | null;
};

type PaidDailyDbRow = RowDataPacket & {
  date: string;
  paidTickets: string | number | null;
  revenue: string | number | null;
};

type TicketClassStatDbRow = RowDataPacket & {
  ticketClass: string | null;
  registeredTickets: string | number | null;
  soldTickets: string | number | null;
  revenue: string | number | null;
  giftTickets: string | number | null;
  totalTickets: string | number | null;
};

function toNumber(value: string | number | null | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRangeKeys(dates: string[]) {
  if (!dates.length) return [toDateKey(new Date())];

  const timestamps = dates.map((date) => new Date(`${date}T00:00:00`).getTime()).filter(Number.isFinite);
  const first = new Date(Math.min(...timestamps));
  const last = new Date(Math.max(...timestamps));
  const keys: string[] = [];

  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    keys.push(toDateKey(cursor));
  }

  return keys;
}

async function getDashboardData() {
  const pool = getDatabasePool();
  const [[metricsRow], [registeredRows], [paidRows], [ticketClassRows]] = await Promise.all([
    pool.query<MetricDbRow[]>(`
      SELECT
        COUNT(1) AS registeredTickets,
        SUM(LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS paidTickets,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ''))) = 'paydone' THEN COALESCE(money, 0) ELSE 0 END), 0) AS estimatedRevenue
      FROM orders
    `),
    pool.query<RegisteredDailyDbRow[]>(`
      SELECT
        DATE_FORMAT(create_time, '%Y-%m-%d') AS date,
        COUNT(1) AS registeredTickets
      FROM orders
      WHERE create_time IS NOT NULL
      GROUP BY DATE_FORMAT(create_time, '%Y-%m-%d')
      ORDER BY date ASC
    `),
    pool.query<PaidDailyDbRow[]>(`
      SELECT
        DATE_FORMAT(COALESCE(update_time, create_time), '%Y-%m-%d') AS date,
        COUNT(1) AS paidTickets,
        COALESCE(SUM(COALESCE(money, 0)), 0) AS revenue
      FROM orders
      WHERE LOWER(TRIM(COALESCE(status, ''))) = 'paydone'
        AND COALESCE(update_time, create_time) IS NOT NULL
      GROUP BY DATE_FORMAT(COALESCE(update_time, create_time), '%Y-%m-%d')
      ORDER BY date ASC
    `),
    pool.query<TicketClassStatDbRow[]>(`
      SELECT
        class_list.ticketClass,
        COALESCE(order_stats.registeredTickets, 0) AS registeredTickets,
        COALESCE(order_stats.soldTickets, 0) AS soldTickets,
        COALESCE(order_stats.revenue, 0) AS revenue,
        COALESCE(order_stats.giftTickets, 0) AS giftTickets,
        COALESCE(order_stats.totalTickets, 0) AS totalTickets
      FROM (
        SELECT ticketClass, MIN(sortOrder) AS sortOrder
        FROM (
          SELECT
            COALESCE(NULLIF(TRIM(ticket_id), ''), NULLIF(TRIM(name), ''), 'Chua phan hang') AS ticketClass,
            COALESCE(nc_order, 999999) AS sortOrder
          FROM ticket
          UNION ALL
          SELECT
            COALESCE(NULLIF(TRIM(\`class\`), ''), 'Chua phan hang') AS ticketClass,
            999999 AS sortOrder
          FROM orders
        ) all_classes
        GROUP BY ticketClass
      ) class_list
      LEFT JOIN (
        SELECT
          COALESCE(NULLIF(TRIM(\`class\`), ''), 'Chua phan hang') AS ticketClass,
          SUM(COALESCE(is_gift, 0) = 0) AS registeredTickets,
          SUM(COALESCE(is_gift, 0) = 0 AND LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS soldTickets,
          COALESCE(SUM(CASE WHEN COALESCE(is_gift, 0) = 0 AND LOWER(TRIM(COALESCE(status, ''))) = 'paydone' THEN COALESCE(money, 0) ELSE 0 END), 0) AS revenue,
          SUM(COALESCE(is_gift, 0) = 1) AS giftTickets,
          COUNT(1) AS totalTickets
        FROM orders
        GROUP BY COALESCE(NULLIF(TRIM(\`class\`), ''), 'Chua phan hang')
      ) order_stats ON order_stats.ticketClass = class_list.ticketClass
      ORDER BY class_list.sortOrder ASC, order_stats.revenue DESC, class_list.ticketClass ASC
    `),
  ]);

  const registeredTickets = toNumber(metricsRow[0]?.registeredTickets);
  const paidTickets = toNumber(metricsRow[0]?.paidTickets);
  const estimatedRevenue = toNumber(metricsRow[0]?.estimatedRevenue);
  const metrics: DashboardMetrics = {
    registeredTickets,
    paidTickets,
    estimatedRevenue,
    conversionRate: registeredTickets > 0 ? (paidTickets / registeredTickets) * 100 : 0,
  };

  const dailyMap = new Map<string, DailyDashboardPoint>();
  const dates = new Set<string>();

  for (const row of registeredRows) {
    dates.add(row.date);
    dailyMap.set(row.date, {
      date: row.date,
      registeredTickets: toNumber(row.registeredTickets),
      paidTickets: 0,
      revenue: 0,
    });
  }

  for (const row of paidRows) {
    dates.add(row.date);
    const current = dailyMap.get(row.date) ?? {
      date: row.date,
      registeredTickets: 0,
      paidTickets: 0,
      revenue: 0,
    };

    dailyMap.set(row.date, {
      ...current,
      paidTickets: toNumber(row.paidTickets),
      revenue: toNumber(row.revenue),
    });
  }

  const chartData = getDateRangeKeys([...dates]).map(
    (date) => dailyMap.get(date) ?? { date, registeredTickets: 0, paidTickets: 0, revenue: 0 },
  );

  const ticketClassStats: TicketClassStat[] = ticketClassRows.map((row) => {
    const registeredByClass = toNumber(row.registeredTickets);
    const soldByClass = toNumber(row.soldTickets);

    return {
      ticketClass: row.ticketClass || "Chua phan hang",
      registeredTickets: registeredByClass,
      soldTickets: soldByClass,
      conversionRate: registeredByClass > 0 ? (soldByClass / registeredByClass) * 100 : 0,
      revenue: toNumber(row.revenue),
      giftTickets: toNumber(row.giftTickets),
      totalTickets: toNumber(row.totalTickets),
    };
  });

  return { chartData, metrics, ticketClassStats };
}

export default async function Page() {
  const { chartData, metrics, ticketClassStats } = await getDashboardData();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards metrics={metrics} />
      <PerformanceOverview data={chartData} />
      <TicketClassStatsTable data={ticketClassStats} />
    </div>
  );
}