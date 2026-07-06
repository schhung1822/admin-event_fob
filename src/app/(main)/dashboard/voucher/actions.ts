"use server";

import { revalidatePath } from "next/cache";

import { getDatabasePool } from "@/lib/db";

const VOUCHER_PATH = "/dashboard/voucher";
const voucherTypes = new Set(["monet", "rate", "money"]);
const ticketClasses = new Set(["GOLD", "RUBY", "VIP"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getOptionalNumber(formData: FormData, key: string) {
  const rawValue = getString(formData, key);
  if (!rawValue) return null;
  const value = Number(rawValue.replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function getOptionalMoney(formData: FormData, key: string) {
  const rawValue = getString(formData, key);
  if (!rawValue) return null;
  const value = Number(rawValue.replace(/[^\d]/g, ""));
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

function normalizeDateTimeLocal(value: string | null) {
  if (!value) return null;
  return value.replace("T", " ").slice(0, 19);
}

function getVoucherType(formData: FormData) {
  const value = getString(formData, "classy");
  return voucherTypes.has(value) ? value : null;
}

function getTicketClass(formData: FormData) {
  const value = getString(formData, "ticketClass");
  return ticketClasses.has(value) ? value : null;
}

function getId(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Voucher ID không hợp lệ.");
  }
  return id;
}

export async function createVoucherAction(formData: FormData) {
  const voucher = getString(formData, "voucher");
  if (!voucher) {
    throw new Error("Vui lòng nhập mã voucher.");
  }

  await getDatabasePool().query(
    `
      INSERT INTO voucher (
        voucher, classy, money, rate, number, \`class\`, from_date, to_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      voucher,
      getVoucherType(formData),
      getOptionalMoney(formData, "money"),
      getOptionalNumber(formData, "rate"),
      getOptionalNumber(formData, "number"),
      getTicketClass(formData),
      normalizeDateTimeLocal(getOptionalString(formData, "fromDate")),
      normalizeDateTimeLocal(getOptionalString(formData, "toDate")),
    ],
  );

  revalidatePath(VOUCHER_PATH);
}

export async function updateVoucherAction(formData: FormData) {
  const id = getId(formData);
  const voucher = getString(formData, "voucher");
  if (!voucher) {
    throw new Error("Vui lòng nhập mã voucher.");
  }

  await getDatabasePool().query(
    `
      UPDATE voucher
      SET
        voucher = ?,
        classy = ?,
        money = ?,
        rate = ?,
        number = ?,
        \`class\` = ?,
        from_date = ?,
        to_date = ?,
        updated_at = NOW()
      WHERE id = ?
      LIMIT 1
    `,
    [
      voucher,
      getVoucherType(formData),
      getOptionalMoney(formData, "money"),
      getOptionalNumber(formData, "rate"),
      getOptionalNumber(formData, "number"),
      getTicketClass(formData),
      normalizeDateTimeLocal(getOptionalString(formData, "fromDate")),
      normalizeDateTimeLocal(getOptionalString(formData, "toDate")),
      id,
    ],
  );

  revalidatePath(VOUCHER_PATH);
}

export async function deleteVoucherAction(formData: FormData) {
  const id = getId(formData);
  await getDatabasePool().query("DELETE FROM voucher WHERE id = ? LIMIT 1", [id]);
  revalidatePath(VOUCHER_PATH);
}