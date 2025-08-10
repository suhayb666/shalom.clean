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
      "SELECT id, employee_name, start_date, end_date, remarks FROM unavailabilities WHERE id = $1",
      [parseInt(id, 10)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Unavailability not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching unavailability:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch unavailability" }, { status: 500 });
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
    const { employee_name, start_date, end_date, remarks } = await req.json();

    if (!employee_name || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields: employee_name, start_date, end_date" }, { status: 400 });
    }

    const res = await client.query(
      "UPDATE unavailabilities SET employee_name = $1, start_date = $2, end_date = $3, remarks = $4 WHERE id = $5 RETURNING *",
      [employee_name, start_date, end_date, remarks, parseInt(id, 10)]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Unavailability not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error updating unavailability:", error);
    return NextResponse.json({ error: error.message || "Failed to update unavailability" }, { status: 500 });
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

    const res = await client.query("DELETE FROM unavailabilities WHERE id = $1 RETURNING id", [parseInt(id, 10)]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Unavailability not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting unavailability:", error);
    return NextResponse.json({ error: error.message || "Failed to delete unavailability" }, { status: 500 });
  } finally {
    await client.end();
  }
}