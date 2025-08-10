import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const { id } = await context.params;
    const res = await client.query(
      "SELECT id, shift_name, start_time, end_time, remarks FROM shifts WHERE id = $1",
      [parseInt(id, 10)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching shift:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch shift" }, { status: 500 });
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
    const { shift_name, start_time, end_time, remarks } = await req.json();

    if (!shift_name || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields: shift_name, start_time, end_time" }, { status: 400 });
    }

    const res = await client.query(
      "UPDATE shifts SET shift_name = $1, start_time = $2, end_time = $3, remarks = $4 WHERE id = $5 RETURNING *",
      [shift_name, start_time, end_time, remarks, parseInt(id, 10)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error updating shift:", error);
    return NextResponse.json({ error: error.message || "Failed to update shift" }, { status: 500 });
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

    const res = await client.query("DELETE FROM shifts WHERE id = $1 RETURNING id", [parseInt(id, 10)]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting shift:", error);
    return NextResponse.json({ error: error.message || "Failed to delete shift" }, { status: 500 });
  } finally {
    await client.end();
  }
}