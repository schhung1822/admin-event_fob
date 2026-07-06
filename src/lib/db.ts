import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function hasDatabaseConfig() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);
}

export function getDatabasePool() {
  if (!hasDatabaseConfig()) {
    throw new Error("Missing database configuration. Please check DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.");
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
      connectionLimit: 10,
      dateStrings: true,
      waitForConnections: true,
    });
  }

  return pool;
}
