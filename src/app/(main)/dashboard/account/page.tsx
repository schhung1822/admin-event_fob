import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getDatabasePool } from "@/lib/db";

import { ensureUsersTable } from "./actions";
import { Accounts } from "./_components/accounts";
import type { AccountRow } from "./_components/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccountDbRow = RowDataPacket & {
  id: number;
  username: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function toText(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

export default async function Page() {
  await ensureUsersTable();

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  const [rows] = await getDatabasePool().query<AccountDbRow[]>(`
    SELECT id, username, name, email, phone, role, created_at, updated_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `);

  const accounts: AccountRow[] = rows.map((row) => ({
    id: Number(row.id),
    username: toText(row.username),
    name: toText(row.name),
    email: toText(row.email),
    phone: toText(row.phone),
    role: toText(row.role) || "admin",
    createdAt: toText(row.created_at),
    updatedAt: toText(row.updated_at),
    isCurrent: Number(row.id) === Number(session?.id ?? 0),
  }));

  return <Accounts accounts={accounts} />;
}