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
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(50),
        date_of_birth DATE,
        email VARCHAR(255),
        phone VARCHAR(50)
      );
    `);

    return NextResponse.json({ success: true, message: "Employees table created or already exists." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}