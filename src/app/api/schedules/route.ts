import { NextRequest, NextResponse } from "next/server";
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
    const res = await client.query("SELECT id, employee_name, store_name, shift_name, start_time, end_time, schedule_date FROM schedules ORDER BY id ASC");
    return NextResponse.json(res.rows);
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function POST(req: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const { employee_name, store_name, shift_name, start_time, end_time, schedule_date } = await req.json();

    if (!employee_name || !store_name || !shift_name || !start_time || !end_time || !schedule_date) {
      return NextResponse.json({ error: "Missing required fields: employee_name, store_name, shift_name, start_time, end_time, schedule_date" }, { status: 400 });
    }

    const res = await client.query(
      "INSERT INTO schedules (employee_name, store_name, shift_name, start_time, end_time, schedule_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [employee_name, store_name, shift_name, start_time, end_time, schedule_date]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to create schedule" }, { status: 500 });
  } finally {
    await client.end();
  }
}
