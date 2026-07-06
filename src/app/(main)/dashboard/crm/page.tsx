import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

import {
  CrmReports,
  type CrmDailyPoint,
  type CrmDimensionPoint,
  type CrmMetricData,
  type CrmSourcePoint,
  type CrmTicketClassPoint,
} from "./_components/crm-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TICKET_GOAL = 1000;

type MetricDbRow = RowDataPacket & {
  registeredTickets: string | number | null;
  paidTickets: string | number | null;
  revenue: string | number | null;
  giftTickets: string | number | null;
  checkins: string | number | null;
  customers: string | number | null;
};

type RegisteredDailyDbRow = RowDataPacket & {
  date: string;
  registeredTickets: string | number | null;
};

type PaidDailyDbRow = RowDataPacket & {
  date: string;
  paidTickets: string | number | null;
};

type DimensionDbRow = RowDataPacket & {
  label: string | null;
  value: string | number | null;
};

type SourceDbRow = RowDataPacket & {
  label: string | null;
  registeredTickets: string | number | null;
  paidTickets: string | number | null;
  revenue: string | number | null;
};

type TicketClassDbRow = RowDataPacket & {
  label: string | null;
  value: string | number | null;
  paidTickets: string | number | null;
  revenue: string | number | null;
  giftTickets: string | number | null;
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

function normalizeDimension(rows: DimensionDbRow[], fallback = "Không rõ"): CrmDimensionPoint[] {
  return rows.map((row) => ({
    label: row.label || fallback,
    value: toNumber(row.value),
  }));
}

function getGenderLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "m" || normalized === "male") return "Nam";
  if (normalized === "f" || normalized === "female") return "Nu";
  if (!normalized || normalized === "Không rõ") return "Không rõ";
  return value;
}

async function getCrmData() {
  const pool = getDatabasePool();
  const [
    [metricsRows],
    [registeredRows],
    [paidRows],
    [genderRows],
    [careerRows],
    [brandRows],
    [sourceRows],
    [trafficSourceRows],
    [ticketClassRows],
  ] = await Promise.all([
    pool.query<MetricDbRow[]>(`
      SELECT
        (SELECT COUNT(1) FROM orders) AS registeredTickets,
        (SELECT COUNT(1) FROM orders WHERE LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS paidTickets,
        (SELECT COALESCE(SUM(COALESCE(money, 0)), 0) FROM orders WHERE LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS revenue,
        (SELECT COUNT(1) FROM orders WHERE COALESCE(is_gift, 0) = 1) AS giftTickets,
        (SELECT COUNT(1) FROM orders WHERE COALESCE(is_checkin, 0) = 1) AS checkins,
        (SELECT COUNT(1) FROM customer) AS customers
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
        COUNT(1) AS paidTickets
      FROM orders
      WHERE LOWER(TRIM(COALESCE(status, ''))) = 'paydone'
        AND COALESCE(update_time, create_time) IS NOT NULL
      GROUP BY DATE_FORMAT(COALESCE(update_time, create_time), '%Y-%m-%d')
      ORDER BY date ASC
    `),
    pool.query<DimensionDbRow[]>(`
      SELECT
        COALESCE(NULLIF(TRIM(gender), ''), 'Không rõ') AS label,
        COUNT(1) AS value
      FROM customer
      GROUP BY COALESCE(NULLIF(TRIM(gender), ''), 'Không rõ')
      ORDER BY value DESC
    `),
    pool.query<DimensionDbRow[]>(`
      SELECT
        COALESCE(NULLIF(TRIM(career), ''), 'Không rõ') AS label,
        COUNT(1) AS value
      FROM customer
      GROUP BY COALESCE(NULLIF(TRIM(career), ''), 'Không rõ')
      ORDER BY value DESC
      LIMIT 50
    `),
    pool.query<DimensionDbRow[]>(`
      SELECT
        COALESCE(NULLIF(TRIM(brand), ''), 'Không rõ') AS label,
        COUNT(1) AS value
      FROM customer
      GROUP BY COALESCE(NULLIF(TRIM(brand), ''), 'Không rõ')
      ORDER BY value DESC
      LIMIT 50
    `),
    pool.query<SourceDbRow[]>(`
      SELECT
        COALESCE(NULLIF(TRIM(ref), ''), 'Không rõ') AS label,
        COUNT(1) AS registeredTickets,
        SUM(LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS paidTickets,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ''))) = 'paydone' THEN COALESCE(money, 0) ELSE 0 END), 0) AS revenue
      FROM orders
      GROUP BY COALESCE(NULLIF(TRIM(ref), ''), 'Không rõ')
      ORDER BY registeredTickets DESC, revenue DESC
      LIMIT 12
    `),
    pool.query<DimensionDbRow[]>(`
      SELECT
        CASE
          WHEN NULLIF(TRIM(utm_campaign), '') IS NULL THEN 'direct'
          WHEN TRIM(utm_campaign) REGEXP '^[0-9]+$' THEN 'Facebook ads'
          ELSE TRIM(utm_campaign)
        END AS label,
        COUNT(1) AS value
      FROM orders
      GROUP BY CASE
        WHEN NULLIF(TRIM(utm_campaign), '') IS NULL THEN 'direct'
        WHEN TRIM(utm_campaign) REGEXP '^[0-9]+$' THEN 'Facebook ads'
        ELSE TRIM(utm_campaign)
      END
      ORDER BY value DESC
      LIMIT 8
    `),
    pool.query<TicketClassDbRow[]>(`
      SELECT
        class_list.ticketClass AS label,
        COALESCE(order_stats.totalTickets, 0) AS value,
        COALESCE(order_stats.paidTickets, 0) AS paidTickets,
        COALESCE(order_stats.revenue, 0) AS revenue,
        COALESCE(order_stats.giftTickets, 0) AS giftTickets
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
          COUNT(1) AS totalTickets,
          SUM(LOWER(TRIM(COALESCE(status, ''))) = 'paydone') AS paidTickets,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ''))) = 'paydone' THEN COALESCE(money, 0) ELSE 0 END), 0) AS revenue,
          SUM(COALESCE(is_gift, 0) = 1) AS giftTickets
        FROM orders
        GROUP BY COALESCE(NULLIF(TRIM(\`class\`), ''), 'Chua phan hang')
      ) order_stats ON order_stats.ticketClass = class_list.ticketClass
      ORDER BY class_list.sortOrder ASC, order_stats.revenue DESC, class_list.ticketClass ASC
    `),
  ]);

  const metricsRow = metricsRows[0];
  const registeredTickets = toNumber(metricsRow?.registeredTickets);
  const paidTickets = toNumber(metricsRow?.paidTickets);
  const revenue = toNumber(metricsRow?.revenue);
  const checkins = toNumber(metricsRow?.checkins);

  const metrics: CrmMetricData = {
    registeredTickets,
    paidTickets,
    revenue,
    conversionRate: registeredTickets > 0 ? (paidTickets / registeredTickets) * 100 : 0,
    customers: toNumber(metricsRow?.customers),
    giftTickets: toNumber(metricsRow?.giftTickets),
    checkins,
    checkinRate: paidTickets > 0 ? (checkins / paidTickets) * 100 : 0,
    ticketGoal: TICKET_GOAL,
    ticketGoalProgress: TICKET_GOAL > 0 ? (paidTickets / TICKET_GOAL) * 100 : 0,
  };

  const dailyMap = new Map<string, CrmDailyPoint>();
  const dates = new Set<string>();

  for (const row of registeredRows) {
    dates.add(row.date);
    dailyMap.set(row.date, {
      date: row.date,
      registeredTickets: toNumber(row.registeredTickets),
      paidTickets: 0,
    });
  }

  for (const row of paidRows) {
    dates.add(row.date);
    const current = dailyMap.get(row.date) ?? { date: row.date, registeredTickets: 0, paidTickets: 0 };
    dailyMap.set(row.date, {
      ...current,
      paidTickets: toNumber(row.paidTickets),
    });
  }

  const dailyTickets = getDateRangeKeys([...dates]).map(
    (date) => dailyMap.get(date) ?? { date, registeredTickets: 0, paidTickets: 0 },
  );

  return {
    metrics,
    dailyTickets,
    gender: normalizeDimension(genderRows).map((item) => ({ ...item, label: getGenderLabel(item.label) })),
    careers: normalizeDimension(careerRows),
    brands: normalizeDimension(brandRows),
    sources: sourceRows.map((row): CrmSourcePoint => ({
      label: row.label || "Khong ro",
      registeredTickets: toNumber(row.registeredTickets),
      paidTickets: toNumber(row.paidTickets),
      revenue: toNumber(row.revenue),
    })),
    trafficSources: normalizeDimension(trafficSourceRows),
    ticketClasses: ticketClassRows.map((row): CrmTicketClassPoint => ({
      label: row.label || "Chua phan hang",
      value: toNumber(row.value),
      paidTickets: toNumber(row.paidTickets),
      revenue: toNumber(row.revenue),
      giftTickets: toNumber(row.giftTickets),
    })),
  };
}

export default async function Page() {
  const data = await getCrmData();

  return <CrmReports data={data} />;
}
