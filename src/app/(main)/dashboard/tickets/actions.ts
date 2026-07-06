"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { getDatabasePool } from "@/lib/db";

const TICKETS_PATH = "/dashboard/tickets";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "tickets");
const PUBLIC_UPLOAD_PREFIX = "/uploads/tickets/";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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

function getImageExtension(file: File) {
  const extensionFromName = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extensionFromName)) {
    return extensionFromName;
  }

  switch (file.type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

async function saveUploadedImage(formData: FormData) {
  const imageFile = formData.get("image_file");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return null;
  }

  if (!imageFile.type.startsWith("image/")) {
    throw new Error("File tải lên phải là ảnh.");
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    throw new Error("Ảnh tải lên không được vượt quá 5MB.");
  }

  const extension = getImageExtension(imageFile);
  if (!extension) {
    throw new Error("Định dạng ảnh không được hỗ trợ.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const targetPath = path.join(UPLOAD_DIR, fileName);
  const bytes = Buffer.from(await imageFile.arrayBuffer());
  await writeFile(targetPath, bytes);

  return `${PUBLIC_UPLOAD_PREFIX}${fileName}`;
}

async function deleteLocalImage(imageUrl: string) {
  if (!imageUrl.startsWith(PUBLIC_UPLOAD_PREFIX)) return;

  const fileName = path.basename(imageUrl);
  if (!fileName) return;

  try {
    await unlink(path.join(UPLOAD_DIR, fileName));
  } catch {
    // Ignore missing files. The DB row is the source of truth for deletion.
  }
}

async function getCurrentTicketImage(id: number) {
  const [rows] = await getDatabasePool().query<Array<RowDataPacket & { img: string | null }>>(
    "SELECT img FROM ticket WHERE id = ? LIMIT 1",
    [id],
  );

  return rows[0]?.img || "";
}

export async function createTicketAction(formData: FormData) {
  const uploadedImage = await saveUploadedImage(formData);
  const imageUrl = uploadedImage || getString(formData, "img");
  const ticketId = getString(formData, "ticket_id") || getString(formData, "name").toUpperCase();

  await getDatabasePool().query(
    `
      INSERT INTO ticket (
        ticket_id, name, money, money_sale, nc_order, time_start, time_end, img, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      ticketId,
      getString(formData, "name"),
      String(getMoney(formData, "money")),
      getOptionalMoney(formData, "money_sale") === null ? null : String(getOptionalMoney(formData, "money_sale")),
      getOptionalNumber(formData, "nc_order"),
      normalizeDateTimeLocal(getOptionalString(formData, "time_start")),
      normalizeDateTimeLocal(getOptionalString(formData, "time_end")),
      imageUrl || null,
    ],
  );

  revalidatePath(TICKETS_PATH);
}

export async function updateTicketAction(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Ticket ID không hợp lệ.");
  }

  const currentImage = await getCurrentTicketImage(id);
  const uploadedImage = await saveUploadedImage(formData);
  const nextImage = uploadedImage || getString(formData, "img") || currentImage;
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
        time_start = ?,
        time_end = ?,
        img = ?,
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
      normalizeDateTimeLocal(getOptionalString(formData, "time_start")),
      normalizeDateTimeLocal(getOptionalString(formData, "time_end")),
      nextImage || null,
      id,
    ],
  );

  if (uploadedImage && currentImage && currentImage !== uploadedImage) {
    await deleteLocalImage(currentImage);
  }

  revalidatePath(TICKETS_PATH);
}

export async function deleteTicketAction(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Ticket ID không hợp lệ.");
  }

  const currentImage = await getCurrentTicketImage(id);
  await getDatabasePool().query("DELETE FROM ticket WHERE id = ? LIMIT 1", [id]);
  await deleteLocalImage(currentImage);

  revalidatePath(TICKETS_PATH);
}
