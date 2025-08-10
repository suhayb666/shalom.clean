import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const { id } = await context.params;
    const res = await client.query("SELECT id, employee_name, store_name, shift_name, start_time, end_time, schedule_date FROM schedules WHERE id = $1", [parseInt(id, 10)]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch schedule" }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const { id } = await context.params;
    const { employee_name, store_name, shift_name, start_time, end_time, schedule_date } = await req.json();

    if (!employee_name || !store_name || !shift_name || !start_time || !end_time || !schedule_date) {
      return NextResponse.json({ error: "Missing required fields: employee_name, store_name, shift_name, start_time, end_time, schedule_date" }, { status: 400 });
    }

    const res = await client.query(
      "UPDATE schedules SET employee_name = $1, store_name = $2, shift_name = $3, start_time = $4, end_time = $5, schedule_date = $6 WHERE id = $7 RETURNING *",
      [employee_name, store_name, shift_name, start_time, end_time, schedule_date, parseInt(id, 10)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to update schedule" }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const { id } = await context.params;

    const res = await client.query("DELETE FROM schedules WHERE id = $1 RETURNING id", [parseInt(id, 10)]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to delete schedule" }, { status: 500 });
  } finally {
    await client.end();
  }
}
