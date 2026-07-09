"use server";

import { revalidatePath } from "next/cache";

import { getDatabasePool } from "@/lib/db";

const TICKETS_PATH = "/dashboard/tickets";
const ticketStatuses = new Set(["active", "sold_out"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getMoney(formData: FormData, key: string) {
  const value = Number(getString(formData, key).replace(/[^\d]/g, ""));
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function getOptionalMoney(formData: FormData, key: string) {
  const rawValue = getString(formData, key);
  if (!rawValue) return null;
  return getMoney(formData, key);
}

function getOptionalNumber(formData: FormData, key: string) {
  const rawValue = getString(formData, key);
  if (!rawValue) return null;
  const value = Number(rawValue.replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function normalizeDateTimeLocal(value: string | null) {
  if (!value) return null;
  return value.replace("T", " ").slice(0, 19);
}

function getTicketStatus(formData: FormData) {
  const status = getString(formData, "status");
  return ticketStatuses.has(status) ? status : "active";
}

export async function createTicketAction(formData: FormData) {
  const ticketId = getString(formData, "ticket_id") || getString(formData, "name").toUpperCase();
  const nextMoneySale = getOptionalMoney(formData, "money_sale");

  await getDatabasePool().query(
    `
      INSERT INTO ticket (
        ticket_id, name, money, money_sale, nc_order, status, time_start, time_end, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      ticketId,
      getString(formData, "name"),
      String(getMoney(formData, "money")),
      nextMoneySale === null ? null : String(nextMoneySale),
      getOptionalNumber(formData, "nc_order"),
      getTicketStatus(formData),
      normalizeDateTimeLocal(getOptionalString(formData, "time_start")),
      normalizeDateTimeLocal(getOptionalString(formData, "time_end")),
    ],
  );

  revalidatePath(TICKETS_PATH);
}

export async function updateTicketAction(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Ticket ID không hợp lệ.");
  }

  const nextMoneySale = getOptionalMoney(formData, "money_sale");

  await getDatabasePool().query(
    `
      UPDATE ticket
      SET
        ticket_id = ?,
        name = ?,
        money = ?,
        money_sale = ?,
        nc_order = ?,
        status = ?,
        time_start = ?,
        time_end = ?,
        updated_at = NOW()
      WHERE id = ?
      LIMIT 1
    `,
    [
      getString(formData, "ticket_id"),
      getString(formData, "name"),
      String(getMoney(formData, "money")),
      nextMoneySale === null ? null : String(nextMoneySale),
      getOptionalNumber(formData, "nc_order"),
      getTicketStatus(formData),
      normalizeDateTimeLocal(getOptionalString(formData, "time_start")),
      normalizeDateTimeLocal(getOptionalString(formData, "time_end")),
      id,
    ],
  );

  revalidatePath(TICKETS_PATH);
}

export async function deleteTicketAction(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Ticket ID không hợp lệ.");
  }

  await getDatabasePool().query("DELETE FROM ticket WHERE id = ? LIMIT 1", [id]);

  revalidatePath(TICKETS_PATH);
}
