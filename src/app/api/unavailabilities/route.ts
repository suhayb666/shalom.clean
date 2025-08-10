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
    const res = await client.query("SELECT id, employee_name, start_date, end_date, remarks FROM unavailabilities ORDER BY id ASC");
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
    const { employee_name, start_date, end_date, remarks } = await req.json();

    if (!employee_name || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields: employee_name, start_date, end_date" }, { status: 400 });
    }

    const res = await client.query(
      "INSERT INTO unavailabilities (employee_name, start_date, end_date, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
      [employee_name, start_date, end_date, remarks]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error("Error creating unavailability:", error);
    return NextResponse.json({ error: error.message || "Failed to create unavailability" }, { status: 500 });
  } finally {
    await client.end();
  }
}