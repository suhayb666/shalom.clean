import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

async function getCurrentUser(req: NextRequest) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/me`, {
      headers: { cookie: req.headers.get("cookie") || "" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const { searchParams } = new URL(req.url);
    const me = searchParams.get("me");

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = `
      SELECT id, employee_name, start_date, end_date, remarks
      FROM unavailabilities
    `;
    const values: any[] = [];

    if (me === "true") {
      query += " WHERE employee_name = $1 ORDER BY id ASC";
      values.push(user.name);
    } else {
      query += " ORDER BY id ASC";
    }

    const res = await client.query(query, values);
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
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const { employee_name, start_date, end_date, remarks } = await req.json();

    if (!employee_name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required fields: employee_name, start_date, end_date" },
        { status: 400 }
      );
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
