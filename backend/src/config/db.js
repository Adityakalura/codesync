import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const serverEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath });
dotenv.config();

// Railway's MySQL plugin exposes MYSQLHOST/MYSQLPORT/...; accept those too.
process.env.MYSQL_HOST ||= process.env.MYSQLHOST;
process.env.MYSQL_PORT ||= process.env.MYSQLPORT;
process.env.MYSQL_USER ||= process.env.MYSQLUSER;
process.env.MYSQL_PASSWORD ||= process.env.MYSQLPASSWORD;
process.env.MYSQL_DATABASE ||= process.env.MYSQLDATABASE;

// Cloud MySQL providers (Aiven, etc.) require encrypted connections. Set MYSQL_SSL=true to enable.
const sslOptions =
  String(process.env.MYSQL_SSL || "").toLowerCase() === "true"
    ? { rejectUnauthorized: false }
    : undefined;

const pool = mysql.createPool({
  ssl: sslOptions,
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "meeting_app",
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initializeDatabase() {
  const host = process.env.MYSQL_HOST || "localhost";
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD || "";
  const database = process.env.MYSQL_DATABASE || "meeting_app";
  const schemaPath = path.resolve(__dirname, "./schema.sql");

  const adminConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: sslOptions,
    multipleStatements: true
  });

  try {
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  } finally {
    await adminConnection.end();
  }

  const schemaSql = await fs.readFile(schemaPath, "utf8");
  await pool.query(schemaSql);
  await migrateMeetingParticipants();
}

async function migrateMeetingParticipants() {
  const [indexes] = await pool.query(
    `SELECT INDEX_NAME, NON_UNIQUE
     FROM information_schema.statistics
     WHERE table_schema = ?
       AND table_name = 'meeting_participants'`,
    [process.env.MYSQL_DATABASE || "meeting_app"]
  );

  const hasMeetingIdIndex = indexes.some(
    (index) => index.INDEX_NAME === "idx_meeting_participants_meeting_id"
  );
  const hasUserIdIndex = indexes.some(
    (index) => index.INDEX_NAME === "idx_meeting_participants_user_id"
  );
  const hasLegacyUniqueIndex = indexes.some(
    (index) => index.INDEX_NAME === "unique_active_entry"
  );
  const hasActiveIndex = indexes.some(
    (index) => index.INDEX_NAME === "idx_meeting_user_active"
  );

  if (!hasMeetingIdIndex) {
    await pool.query(
      "ALTER TABLE meeting_participants ADD INDEX idx_meeting_participants_meeting_id (meeting_id)"
    );
  }

  if (!hasUserIdIndex) {
    await pool.query(
      "ALTER TABLE meeting_participants ADD INDEX idx_meeting_participants_user_id (user_id)"
    );
  }

  if (hasLegacyUniqueIndex) {
    await pool.query("ALTER TABLE meeting_participants DROP INDEX unique_active_entry");
  }

  if (!hasActiveIndex) {
    await pool.query(
      "ALTER TABLE meeting_participants ADD INDEX idx_meeting_user_active (meeting_id, user_id, is_active)"
    );
  }
}

export default pool;
