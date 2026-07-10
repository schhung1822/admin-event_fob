"use server";

import { revalidatePath } from "next/cache";

import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

const CHECKIN_PATH = "/dashboard/checkin";
const ORDERS_PATH = "/dashboard/orders";

export type CheckinSource = "camera" | "upload" | "manual";

export type CheckinResult =
  | {
      status: "success" | "repeat";
      title: string;
      message: string;
      ticket: CheckinTicket;
    }
  | {
      status: "invalid";
      title: string;
      message: string;
      scannedCode?: string;
      ticket?: CheckinTicket;
    };

export type CheckinTicket = {
  id: number;
  ordercode: string;
  name: string;
  phone: string;
  email: string;
  ticketClass: string;
  paymentStatus: string;
  checkinCount: number;
  checkinTime: string;
  zoneName: string;
  source: CheckinSource;
};

type OrderCheckinRow = RowDataPacket & {
  id: number;
  ordercode: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  class: string | null;
  status: string | null;
  number_checkin: number | string | null;
};

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getVietnamNowString() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function toCheckinTicket({
  order,
  checkinCount,
  checkinTime,
  source,
  zoneName,
}: {
  order: OrderCheckinRow;
  checkinCount: number;
  checkinTime: string;
  source: CheckinSource;
  zoneName: string;
}): CheckinTicket {
  return {
    id: Number(order.id),
    ordercode: String(order.ordercode ?? ""),
    name: String(order.name ?? ""),
    phone: String(order.phone ?? ""),
    email: String(order.email ?? ""),
    ticketClass: String(order.class ?? ""),
    paymentStatus: String(order.status ?? ""),
    checkinCount,
    checkinTime,
    zoneName,
    source,
  };
}

export async function checkinTicketAction({
  ordercode,
  source,
  zoneId,
  zoneName,
}: {
  ordercode: string;
  source: CheckinSource;
  zoneId: string;
  zoneName: string;
}): Promise<CheckinResult> {
  const code = normalizeCode(ordercode);

  if (!code) {
    return {
      status: "invalid",
      title: "Ve khong hop le",
      message: "Vui long nhap hoac quet ma ve.",
    };
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  const now = getVietnamNowString();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<OrderCheckinRow[]>(
      `
        SELECT
          id,
          ordercode,
          name,
          phone,
          email,
          class,
          status,
          COALESCE(number_checkin, 0) AS number_checkin
        FROM orders
        WHERE UPPER(TRIM(ordercode)) = ?
        LIMIT 1
        FOR UPDATE
      `,
      [code],
    );
    const order = rows[0];

    if (!order) {
      await connection.rollback();
      return {
        status: "invalid",
        title: "Ve khong hop le",
        message: "Khong tim thay ve co ma nay.",
        scannedCode: code,
      };
    }

    if (normalizeStatus(order.status) !== "paydone") {
      await connection.query(
        `
          INSERT INTO checkin_log (order_id, ordercode, zone_id, zone_name, source, checkin_time, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [order.id, code, zoneId, zoneName, source, now, "system"],
      );
      await connection.commit();

      revalidatePath(CHECKIN_PATH);

      return {
        status: "invalid",
        title: "Ve khong hop le",
        message: "Ve chua thanh toan nen khong the check-in.",
        scannedCode: code,
        ticket: toCheckinTicket({
          order,
          checkinCount: Number(order.number_checkin ?? 0),
          checkinTime: "",
          source,
          zoneName,
        }),
      };
    }

    const nextCheckinCount = Number(order.number_checkin ?? 0) + 1;

    await connection.query(
      `
        UPDATE orders
        SET
          is_checkin = 1,
          number_checkin = ?,
          checkin_time = ?,
          update_time = ?
        WHERE id = ?
        LIMIT 1
      `,
      [nextCheckinCount, now, now, order.id],
    );

    await connection.query(
      `
        INSERT INTO checkin_log (order_id, ordercode, zone_id, zone_name, source, checkin_time, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [order.id, code, zoneId, zoneName, source, now, "system"],
    );

    await connection.commit();

    revalidatePath(CHECKIN_PATH);
    revalidatePath(ORDERS_PATH);

    const ticket = toCheckinTicket({
      order,
      checkinCount: nextCheckinCount,
      checkinTime: now,
      source,
      zoneName,
    });

    if (nextCheckinCount === 1) {
      return {
        status: "success",
        title: "Check-in thanh cong",
        message: "Check-in thanh cong",
        ticket,
      };
    }

    return {
      status: "repeat",
      title: `Check-in lan thu ${nextCheckinCount}`,
      message: "Ve nay da duoc check-in truoc do.",
      ticket,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
