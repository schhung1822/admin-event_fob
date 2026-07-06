"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

const ORDERS_PATH = "/dashboard/orders";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getInteger(formData: FormData, key: string) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function getMoney(formData: FormData) {
  const value = Number(getString(formData, "money").replace(/[^\d]/g, ""));
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
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

function generateOrderCode() {
  return `AD${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
}

async function generateUniqueOrderCode() {
  const pool = getDatabasePool();

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const orderCode = generateOrderCode();
    const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
      "SELECT id FROM orders WHERE ordercode = ? LIMIT 1",
      [orderCode],
    );

    if (rows.length === 0) {
      return orderCode;
    }
  }

  throw new Error("Không thể tạo mã vé không trùng. Vui lòng thử lại.");
}

function getGiftState(formData: FormData) {
  return getString(formData, "ticket_type") === "gift" || getInteger(formData, "is_gift") === 1;
}

function getGender(formData: FormData) {
  const gender = getString(formData, "gender");
  return gender === "none" ? "" : gender;
}

export async function createOrderAction(formData: FormData) {
  const pool = getDatabasePool();
  const now = getVietnamNowString();
  const isGift = getGiftState(formData);
  const money = isGift ? 0 : getMoney(formData);

  await pool.query(
    `
      INSERT INTO orders (
        ordercode, create_time, update_time, name, phone, email, gender, class, money, status,
        is_gift, is_checkin, number_checkin, send_noti
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paydone', ?, 0, 0, 0)
    `,
    [
      await generateUniqueOrderCode(),
      now,
      now,
      getString(formData, "name"),
      getString(formData, "phone"),
      getString(formData, "email"),
      getGender(formData),
      getString(formData, "class"),
      money,
      isGift ? 1 : 0,
    ],
  );

  revalidatePath(ORDERS_PATH);
}

export async function updateOrderAction(formData: FormData) {
  const id = getInteger(formData, "id");

  if (!id) {
    throw new Error("Missing order id.");
  }

  const isGift = getGiftState(formData);
  const isCheckin = getInteger(formData, "is_checkin") === 1;

  await getDatabasePool().query(
    `
      UPDATE orders
      SET
        name = ?,
        phone = ?,
        email = ?,
        gender = ?,
        class = ?,
        money = ?,
        is_gift = ?,
        is_checkin = ?,
        number_checkin = CASE WHEN ? = 1 THEN GREATEST(COALESCE(number_checkin, 0), 1) ELSE 0 END,
        checkin_time = CASE WHEN ? = 1 THEN ? ELSE NULL END
      WHERE id = ?
      LIMIT 1
    `,
    [
      getString(formData, "name"),
      getString(formData, "phone"),
      getString(formData, "email"),
      getGender(formData),
      getString(formData, "class"),
      isGift ? 0 : getMoney(formData),
      isGift ? 1 : 0,
      isCheckin ? 1 : 0,
      isCheckin ? 1 : 0,
      isCheckin ? 1 : 0,
      getVietnamNowString(),
      id,
    ],
  );

  revalidatePath(ORDERS_PATH);
}

export async function deleteOrderAction(formData: FormData) {
  const id = getInteger(formData, "id");

  if (!id) {
    throw new Error("Missing order id.");
  }

  await getDatabasePool().query("DELETE FROM orders WHERE id = ? LIMIT 1", [id]);
  revalidatePath(ORDERS_PATH);
}
