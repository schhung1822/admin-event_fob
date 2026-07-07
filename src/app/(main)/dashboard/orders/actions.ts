"use server";

import { revalidatePath } from "next/cache";

import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

const ORDERS_PATH = "/dashboard/orders";
const PAYMENT_WEBHOOK_URL = "https://nextg.nextgency.vn/webhook/fob/update-payment";

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

function getQuantity(formData: FormData) {
  const value = getInteger(formData, "quantity");
  return Math.min(Math.max(value, 1), 500);
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

function generateCode(prefix: "AD" | "DH") {
  return `${prefix}${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
}

async function generateUniqueCode(
  column: "ordercode" | "order_id",
  prefix: "AD" | "DH",
  reservedCodes = new Set<string>(),
) {
  const pool = getDatabasePool();

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = generateCode(prefix);

    if (reservedCodes.has(code)) {
      continue;
    }

    const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
      `SELECT id FROM orders WHERE ${column} = ? LIMIT 1`,
      [code],
    );

    if (rows.length === 0) {
      return code;
    }
  }

  throw new Error("Khong the tao ma khong trung. Vui long thu lai.");
}

async function sendPaymentWebhook({
  orderId,
  totalMoney,
  transactionDate,
}: {
  orderId: string;
  totalMoney: number;
  transactionDate: string;
}) {
  const response = await fetch(PAYMENT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionDate,
      code: orderId,
      transferAmount: totalMoney,
    }),
  });

  if (!response.ok) {
    throw new Error(`Payment webhook failed with status ${response.status}.`);
  }
}

function getGiftState(formData: FormData) {
  return getString(formData, "ticket_type") === "gift" || getInteger(formData, "is_gift") === 1;
}

function getGender(formData: FormData) {
  const gender = getString(formData, "gender");
  return gender === "none" ? "" : gender;
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getPaymentStatus(formData: FormData) {
  const status = normalizeStatus(getString(formData, "status"));

  if (status === "paydone" || status === "paid") {
    return status;
  }

  return "new";
}

export async function createOrderAction(formData: FormData) {
  const pool = getDatabasePool();
  const now = getVietnamNowString();
  const isGift = getGiftState(formData);
  const money = isGift ? 0 : getMoney(formData);
  const quantity = getQuantity(formData);
  const totalMoney = money * quantity;
  const orderId = await generateUniqueCode("order_id", "DH");
  const usedOrderCodes = new Set<string>();
  const orderCodes: string[] = [];

  for (let index = 0; index < quantity; index += 1) {
    const code = await generateUniqueCode("ordercode", "AD", usedOrderCodes);
    usedOrderCodes.add(code);
    orderCodes.push(code);
  }

  await pool.query(
    `
      INSERT INTO orders (
        order_id, ordercode, create_time, update_time, name, phone, email, gender, class, money, status,
        is_gift, is_checkin, number_checkin, send_noti
      ) VALUES ?
    `,
    [
      orderCodes.map((orderCode) => [
        orderId,
        orderCode,
        now,
        now,
        getString(formData, "name"),
        getString(formData, "phone"),
        getString(formData, "email"),
        getGender(formData),
        getString(formData, "class"),
        money,
        "paydone",
        isGift ? 1 : 0,
        0,
        0,
        0,
      ]),
    ],
  );

  await sendPaymentWebhook({
    orderId,
    totalMoney,
    transactionDate: now,
  });

  revalidatePath(ORDERS_PATH);
}

export async function updateOrderAction(formData: FormData) {
  const id = getInteger(formData, "id");

  if (!id) {
    throw new Error("Missing order id.");
  }

  const pool = getDatabasePool();
  const isGift = getGiftState(formData);
  const isCheckin = getInteger(formData, "is_checkin") === 1;
  const nextStatus = getPaymentStatus(formData);
  const nextMoney = isGift ? 0 : getMoney(formData);
  const [existingRows] = await pool.query<
    Array<
      RowDataPacket & {
        create_time: string;
        money: string | number | null;
        order_id: string | null;
        status: string | null;
      }
    >
  >(
    `
      SELECT
        COALESCE(DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s'), ?) AS create_time,
        money,
        order_id,
        status
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [getVietnamNowString(), id],
  );
  const existingOrder = existingRows[0];

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  const orderId = existingOrder.order_id || (await generateUniqueCode("order_id", "DH"));

  await pool.query(
    `
      UPDATE orders
      SET
        order_id = CASE WHEN COALESCE(TRIM(order_id), '') = '' THEN ? ELSE order_id END,
        name = ?,
        phone = ?,
        email = ?,
        gender = ?,
        class = ?,
        money = ?,
        status = ?,
        is_gift = ?,
        is_checkin = ?,
        number_checkin = CASE WHEN ? = 1 THEN GREATEST(COALESCE(number_checkin, 0), 1) ELSE 0 END,
        checkin_time = CASE WHEN ? = 1 THEN ? ELSE NULL END
      WHERE id = ?
      LIMIT 1
    `,
    [
      orderId,
      getString(formData, "name"),
      getString(formData, "phone"),
      getString(formData, "email"),
      getGender(formData),
      getString(formData, "class"),
      nextMoney,
      nextStatus,
      isGift ? 1 : 0,
      isCheckin ? 1 : 0,
      isCheckin ? 1 : 0,
      isCheckin ? 1 : 0,
      getVietnamNowString(),
      id,
    ],
  );

  if (normalizeStatus(existingOrder.status) !== "paydone" && nextStatus === "paydone") {
    let totalMoney = nextMoney;
    const [totalRows] = await pool.query<Array<RowDataPacket & { total_money: string | number | null }>>(
      "SELECT COALESCE(SUM(COALESCE(money, 0)), 0) AS total_money FROM orders WHERE order_id = ?",
      [orderId],
    );
    totalMoney = Number(totalRows[0]?.total_money ?? nextMoney);

    await sendPaymentWebhook({
      orderId,
      totalMoney,
      transactionDate: existingOrder.create_time,
    });
  }

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
