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
      CREATE TABLE IF NOT EXISTS employee_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        request_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        request_date DATE NOT NULL DEFAULT CURRENT_DATE,
        start_date DATE,
        end_date DATE,
        original_shift_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
        requested_shift_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
        swap_with_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        admin_notes TEXT,
        remarks TEXT
      );
    `);

    return NextResponse.json({ success: true, message: "Employee_requests table created or already exists." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run employee_requests migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}
