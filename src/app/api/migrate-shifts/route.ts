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
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        shift_name VARCHAR(255) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        remarks TEXT
      );
    `);

    return NextResponse.json({ success: true, message: "Shifts table created or already exists." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}