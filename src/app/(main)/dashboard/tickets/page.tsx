import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

import type { TicketRow } from "./_components/schema";
import { Tickets } from "./_components/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TicketDbRow = RowDataPacket & TicketRow;

async function getTickets() {
  const [rows] = await getDatabasePool().query<TicketDbRow[]>(`
    SELECT
      id,
      COALESCE(ticket_id, '') AS ticket_id,
      COALESCE(name, '') AS name,
      COALESCE(money, '0') AS money,
      money_sale,
      nc_order,
      COALESCE(DATE_FORMAT(time_start, '%Y-%m-%d %H:%i:%s'), '') AS time_start,
      COALESCE(DATE_FORMAT(time_end, '%Y-%m-%d %H:%i:%s'), '') AS time_end,
      COALESCE(NULLIF(status, ''), 'active') AS status,
      COALESCE(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at,
      COALESCE(DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updated_at
    FROM ticket
    ORDER BY nc_order ASC, id ASC
  `);

  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    money: Number(String(row.money).replace(/[^\d]/g, "")),
    money_sale: row.money_sale === null ? null : Number(String(row.money_sale).replace(/[^\d]/g, "")),
    nc_order: row.nc_order === null ? null : Number(row.nc_order),
  }));
}

export default async function Page() {
  const tickets = await getTickets();
  return <Tickets tickets={tickets} />;
}
