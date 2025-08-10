// src/app/api/employees/route.ts
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
    try {
      const res = await client.query(
        "SELECT id, name, gender, date_of_birth, position, email, phone FROM employees ORDER BY id ASC"
      );
      return NextResponse.json(res.rows);
    } catch (err) {
      // If columns do not exist yet, attempt to add them and retry once
      const error = err as unknown as { code?: string; message?: string };
      if (error.code === "42703") {
        await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
        await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50)");
        const res = await client.query(
          "SELECT id, name, gender, date_of_birth, position, email, phone FROM employees ORDER BY id ASC"
        );
        return NextResponse.json(res.rows);
      }
      throw err;
    }
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}

