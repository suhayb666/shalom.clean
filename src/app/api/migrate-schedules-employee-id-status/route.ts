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

    // Add employee_id to schedules table
    await client.query(`
      ALTER TABLE schedules
      ADD COLUMN IF NOT EXISTS employee_id INTEGER,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';
    `);

    // Populate employee_id for existing schedules based on employee_name
    await client.query(`
      UPDATE schedules s
      SET employee_id = e.id
      FROM employees e
      WHERE s.employee_name = e.name AND s.employee_id IS NULL;
    `);

    // Add foreign key constraint after populating
    await client.query(`
      ALTER TABLE schedules
      ADD CONSTRAINT fk_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id)
      ON DELETE SET NULL;
    `);

    return NextResponse.json({ success: true, message: "Schedules table updated with employee_id and status." });
  } catch (err) {
    const error = err as Error;
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Failed to run schedules migration" }, { status: 500 });
  } finally {
    await client.end();
  }
}
