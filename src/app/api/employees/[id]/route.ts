import { NextResponse } from "next/server";
import { Client } from "pg";

// GET employee by ID
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!id || Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM employees WHERE id = $1", [numericId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Server error" }, { status: 500 });
  } finally {
    await client.end();
  }
}

// DELETE employee by ID
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!id || Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("DELETE FROM employees WHERE id = $1", [numericId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Server error" }, { status: 500 });
  } finally {
    await client.end();
  }
}
