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
    const res = await client.query("SELECT id, shift_name, start_time, end_time, remarks FROM shifts ORDER BY id ASC");
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
    const { shift_name, start_time, end_time, remarks } = await req.json();

    if (!shift_name || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields: shift_name, start_time, end_time" }, { status: 400 });
    }

    const res = await client.query(
      "INSERT INTO shifts (shift_name, start_time, end_time, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
      [shift_name, start_time, end_time, remarks]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error("Error creating shift:", error);
    return NextResponse.json({ error: error.message || "Failed to create shift" }, { status: 500 });
  } finally {
    await client.end();
  }
}