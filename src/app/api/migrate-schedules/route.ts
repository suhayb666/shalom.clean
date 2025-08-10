import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        shift_name VARCHAR(255) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL
      );
    `);

    return NextResponse.json({ success: true, message: "Schedules table created or already exists." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}
