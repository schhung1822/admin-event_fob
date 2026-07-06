"use server";

import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { getDatabasePool } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type LoginState = {
  error?: string;
};

type UserDbRow = RowDataPacket & {
  id: number;
  username: string;
  password_hash: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.has("remember");

  if (!username || !password) {
    return { error: "Vui lòng nhập tài khoản và mật khẩu." };
  }

  const [users] = await getDatabasePool().query<UserDbRow[]>(
    "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  const user = users[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Tài khoản hoặc mật khẩu không đúng." };
  }

  const maxAge = remember ? SESSION_MAX_AGE : 60 * 60 * 12;
  const token = await createSessionToken({ id: Number(user.id), username: user.username }, maxAge);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/dashboard/default");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/auth/v1/login");
}
