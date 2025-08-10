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
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS position VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    `);

    return NextResponse.json({ success: true, message: "'position' column added to employees table or already exists." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}