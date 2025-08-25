import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest} from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    console.log("🔄 Unavailabilities API - Starting GET request");
    
    // Get authenticated user using the shared auth utility
    const user = await getCurrentUserFromRequest(req);
    console.log("👤 User check:", user ? `Authenticated as ${user.name} (${user.role})` : "❌ Not authenticated");
    
    if (!user) {
      console.log("❌ Unauthorized access to unavailabilities");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const me = searchParams.get("me");
    console.log("🔍 Query params - me:", me);

    let query = `
      SELECT id, employee_name, start_date, end_date, remarks
      FROM unavailabilities
    `;
    const values: any[] = [];

    if (me === "true") {
      query += " WHERE employee_name = $1 ORDER BY id ASC";
      values.push(user.name);
      console.log("🔍 Filtering for user:", user.name);
    } else {
      query += " ORDER BY id ASC";
      console.log("🔍 Getting all unavailabilities");
    }

    console.log("📊 Executing query:", query);
    console.log("📊 Query values:", values);

    const client = await pool.connect();
    try {
      const res = await client.query(query, values);
      console.log("✅ Query successful - Found", res.rows.length, "unavailabilities");
      return NextResponse.json(res.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    const error = err as Error;
    console.error("❌ Unavailabilities API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Unavailabilities API - Starting POST request");
    
    // Get authenticated user
    const user = await getCurrentUserFromRequest(req);
    console.log("👤 User check:", user ? `Authenticated as ${user.name} (${user.role})` : "❌ Not authenticated");
    
    if (!user) {
      console.log("❌ Unauthorized access to create unavailability");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employee_name, start_date, end_date, remarks } = await req.json();
    console.log("📝 Creating unavailability for:", employee_name);

    if (!employee_name || !start_date || !end_date) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: employee_name, start_date, end_date" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const res = await client.query(
        "INSERT INTO unavailabilities (employee_name, start_date, end_date, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
        [employee_name, start_date, end_date, remarks]
      );
      console.log("✅ Unavailability created successfully:", res.rows[0]);
      return NextResponse.json(res.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    const error = err as Error;
    console.error("❌ Error creating unavailability:", error);
    return NextResponse.json({ error: error.message || "Failed to create unavailability" }, { status: 500 });
  }
}