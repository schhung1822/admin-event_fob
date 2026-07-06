import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

import type { VoucherRow } from "./_components/schema";
import { Vouchers } from "./_components/vouchers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VoucherDbRow = RowDataPacket & {
  id: number;
  voucher: string | null;
  classy: VoucherRow["classy"] | null;
  money: string | number | null;
  rate: string | number | null;
  number: string | number | null;
  ticketClass: VoucherRow["ticketClass"] | null;
  fromDate: string | null;
  toDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toVoucherClassy(value: string | null | undefined): VoucherRow["classy"] {
  return value === "monet" || value === "rate" || value === "money" ? value : "";
}

function toTicketClass(value: string | null | undefined): VoucherRow["ticketClass"] {
  return value === "GOLD" || value === "RUBY" || value === "VIP" ? value : "";
}

async function getVouchers() {
  const [rows] = await getDatabasePool().query<VoucherDbRow[]>(`
    SELECT
      id,
      COALESCE(voucher, '') AS voucher,
      COALESCE(classy, '') AS classy,
      money,
      rate,
      number,
      COALESCE(\`class\`, '') AS ticketClass,
      COALESCE(DATE_FORMAT(from_date, '%Y-%m-%d %H:%i:%s'), '') AS fromDate,
      COALESCE(DATE_FORMAT(to_date, '%Y-%m-%d %H:%i:%s'), '') AS toDate,
      COALESCE(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), '') AS createdAt,
      COALESCE(DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updatedAt
    FROM voucher
    ORDER BY id DESC
  `);

  return rows.map((row) => ({
    id: Number(row.id),
    voucher: row.voucher || "",
    classy: toVoucherClassy(row.classy),
    money: toNumber(row.money),
    rate: toNumber(row.rate),
    number: toNumber(row.number),
    ticketClass: toTicketClass(row.ticketClass),
    fromDate: row.fromDate || "",
    toDate: row.toDate || "",
    createdAt: row.createdAt || "",
    updatedAt: row.updatedAt || "",
  }));
}

export default async function Page() {
  const vouchers = await getVouchers();
  return <Vouchers vouchers={vouchers} />;
}