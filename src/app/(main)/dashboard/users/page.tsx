import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

import type { UserRow } from "./_components/data";
import { Users } from "./_components/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CustomerRecord = RowDataPacket & {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  nc_order: string | number | null;
  customer_id: string | null;
  name: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  career: string | null;
  user_ip: string | null;
  user_agent: string | null;
  fbp: string | null;
  fbc: string | null;
  create_time: string | null;
  ttclid: string | null;
  ttp: string | null;
  brand: string | null;
  paid_ticket_count: string | number | null;
  paid_spend: string | number | null;
};

function toText(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function toNumber(value: string | number | null | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default async function Page() {
  const pool = getDatabasePool();
  const [rows] = await pool.query<CustomerRecord[]>(`
    SELECT
      c.id,
      c.created_at,
      c.updated_at,
      c.created_by,
      c.updated_by,
      c.nc_order,
      c.customer_id,
      c.name,
      c.gender,
      c.phone,
      c.email,
      c.career,
      c.user_ip,
      c.user_agent,
      c.fbp,
      c.fbc,
      c.create_time,
      c.ttclid,
      c.ttp,
      c.brand,
      (
        SELECT COUNT(*)
        FROM orders o
        WHERE LOWER(TRIM(COALESCE(o.status, ''))) = 'paydone'
          AND (
            (NULLIF(c.customer_id, '') IS NOT NULL AND o.customer_id = c.customer_id)
            OR (NULLIF(c.phone, '') IS NOT NULL AND o.phone = c.phone)
            OR (NULLIF(c.email, '') IS NOT NULL AND o.email = c.email)
          )
      ) AS paid_ticket_count,
      (
        SELECT COALESCE(SUM(COALESCE(o.money, 0)), 0)
        FROM orders o
        WHERE LOWER(TRIM(COALESCE(o.status, ''))) = 'paydone'
          AND (
            (NULLIF(c.customer_id, '') IS NOT NULL AND o.customer_id = c.customer_id)
            OR (NULLIF(c.phone, '') IS NOT NULL AND o.phone = c.phone)
            OR (NULLIF(c.email, '') IS NOT NULL AND o.email = c.email)
          )
      ) AS paid_spend
    FROM customer c
    ORDER BY COALESCE(c.create_time, c.updated_at, c.created_at) DESC, c.id DESC
  `);

  const users: UserRow[] = rows.map((row) => ({
    id: row.id,
    createdAt: toText(row.created_at),
    updatedAt: toText(row.updated_at),
    createdBy: toText(row.created_by),
    updatedBy: toText(row.updated_by),
    ncOrder: toText(row.nc_order),
    customerId: toText(row.customer_id),
    name: toText(row.name),
    gender: toText(row.gender),
    phone: toText(row.phone),
    email: toText(row.email),
    career: toText(row.career),
    brand: toText(row.brand),
    userIp: toText(row.user_ip),
    userAgent: toText(row.user_agent),
    fbp: toText(row.fbp),
    fbc: toText(row.fbc),
    ttclid: toText(row.ttclid),
    ttp: toText(row.ttp),
    createTime: toText(row.create_time),
    paidTicketCount: toNumber(row.paid_ticket_count),
    paidSpend: toNumber(row.paid_spend),
  }));

  return <Users users={users} />;
}