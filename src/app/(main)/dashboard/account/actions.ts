"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import type { RowDataPacket } from "mysql2";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getDatabasePool } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const ACCOUNT_PATH = "/dashboard/account";

type PasswordState = {
  error?: string;
  success?: string;
};

type AccountDbRow = RowDataPacket & {
  id: number;
  password_hash: string;
};

type ColumnRow = RowDataPacket & {
  column_name: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getAccountRole(formData: FormData) {
  return getString(formData, "role") === "staff" ? "staff" : "admin";
}

async function addMissingUsersColumns() {
  const [columns] = await getDatabasePool().query<ColumnRow[]>(
    `SELECT LOWER(COLUMN_NAME) AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`,
  );
  const existingColumns = new Set(columns.map((column) => column.column_name));

  if (!existingColumns.has("email")) {
    await getDatabasePool().query("ALTER TABLE users ADD COLUMN email VARCHAR(191) NULL AFTER name");
  }

  if (!existingColumns.has("phone")) {
    await getDatabasePool().query("ALTER TABLE users ADD COLUMN phone VARCHAR(64) NULL AFTER email");
  }

  if (!existingColumns.has("role")) {
    await getDatabasePool().query("ALTER TABLE users ADD COLUMN role VARCHAR(64) NOT NULL DEFAULT 'admin' AFTER phone");
  }
}

export async function ensureUsersTable() {
  await getDatabasePool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT,
      username VARCHAR(191) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(191) NULL,
      email VARCHAR(191) NULL,
      phone VARCHAR(64) NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'admin',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_username_unique (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addMissingUsersColumns();
}

async function getCurrentSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

async function getCurrentUserRole() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [rows] = await getDatabasePool().query<Array<RowDataPacket & { role: string | null }>>(
    "SELECT role FROM users WHERE id = ? LIMIT 1",
    [session.id],
  );

  return rows[0]?.role || session.role || "admin";
}

export async function changeCurrentPasswordAction(_state: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await getCurrentSession();
  if (!session) return { error: "Phiên đăng nhập đã hết hạn." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Vui lòng nhập đầy đủ thông tin mật khẩu." };
  }

  if (newPassword.length < 6) {
    return { error: "Mật khẩu mới tối thiểu 6 ký tự." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  await ensureUsersTable();
  const [rows] = await getDatabasePool().query<AccountDbRow[]>(
    "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
    [session.id],
  );
  const user = rows[0];

  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return { error: "Mật khẩu hiện tại không đúng." };
  }

  await getDatabasePool().query("UPDATE users SET password_hash = ? WHERE id = ? LIMIT 1", [
    hashPassword(newPassword),
    session.id,
  ]);

  revalidatePath(ACCOUNT_PATH);
  return { success: "Đã đổi mật khẩu tài khoản hiện tại." };
}

export async function saveAccountAction(formData: FormData) {
  await ensureUsersTable();
  if ((await getCurrentUserRole()) !== "admin") return;

  const id = Number(formData.get("id") ?? 0);
  const username = getString(formData, "username");
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const phone = getString(formData, "phone");
  const role = getAccountRole(formData);
  const password = String(formData.get("password") ?? "");

  if (!username || !email || !phone) return;

  if (id > 0) {
    if (password) {
      await getDatabasePool().query(
        "UPDATE users SET username = ?, name = ?, email = ?, phone = ?, role = ?, password_hash = ? WHERE id = ? LIMIT 1",
        [username, name || null, email, phone, role, hashPassword(password), id],
      );
    } else {
      await getDatabasePool().query(
        "UPDATE users SET username = ?, name = ?, email = ?, phone = ?, role = ? WHERE id = ? LIMIT 1",
        [username, name || null, email, phone, role, id],
      );
    }
  } else {
    if (password.length < 6) return;
    await getDatabasePool().query(
      "INSERT INTO users (username, password_hash, name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashPassword(password), name || null, email, phone, role],
    );
  }

  revalidatePath(ACCOUNT_PATH);
}

export async function deleteAccountAction(formData: FormData) {
  await ensureUsersTable();
  if ((await getCurrentUserRole()) !== "admin") return;

  const session = await getCurrentSession();
  const id = Number(formData.get("id") ?? 0);

  if (!session || !id || id === session.id) return;

  const [[countRow]] = await getDatabasePool().query<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(1) AS total FROM users",
  );
  if (Number(countRow?.total ?? 0) <= 1) return;

  await getDatabasePool().query("DELETE FROM users WHERE id = ? LIMIT 1", [id]);
  revalidatePath(ACCOUNT_PATH);
}
