import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    console.log("🚀 Schedules API called");
    
    const { searchParams } = new URL(req.url);
    const me = searchParams.get("me");

    console.log("🔐 Authenticating user...");
    const user = await getCurrentUserFromRequest(req);
    
    if (!user) {
      console.log("❌ Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User authenticated:", user.name, "Role:", user.role);

    let query = `
      SELECT id, employee_id, employee_name, store_name, shift_name, start_time, end_time, schedule_date, is_open_shift, status
      FROM schedules
    `;
    const values: any[] = [];
    const conditions: string[] = [];

    // Handle is_open_shift filter
    const isOpenShiftParam = searchParams.get("is_open_shift");
    if (isOpenShiftParam !== null) {
      conditions.push(`is_open_shift = ${isOpenShiftParam === "true"}`);
    }

    if (me === "true") {
      conditions.push("employee_name = $1");
      values.push(user.name);
      console.log("📋 Fetching schedules for user:", user.name);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY schedule_date DESC, id ASC";

    const result = await pool.query(query, values);
    console.log("✅ Found", result.rows.length, "schedules");
    
    const schedules = result.rows.map(row => ({
      ...row,
      employee_name: row.employee_name === null ? "Open Shift" : row.employee_name
    }));

    return NextResponse.json(schedules);
    
  } catch (error) {
    console.error("🚨 Schedules GET Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Schedules POST called");
    
    console.log("🔐 Authenticating user...");
    const user = await getCurrentUserFromRequest(req);
    
    if (!user) {
      console.log("❌ Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User authenticated:", user.name, "Role:", user.role);
    
    const { employee_name, store_name, shift_name, start_time, end_time, schedule_date, is_open_shift } = await req.json();

    if ((!employee_name && !is_open_shift) || !store_name || !shift_name || !start_time || !end_time || !schedule_date) {
      console.log("❌ Missing required fields or invalid open shift creation");
      return NextResponse.json(
        { error: "Missing required fields: store_name, shift_name, start_time, end_time, schedule_date. Employee name is required unless it's an open shift." },
        { status: 400 }
      );
    }

    console.log("📝 Creating schedule for:", employee_name || "Open Shift");
    
    const result = await pool.query(
      "INSERT INTO schedules (employee_name, store_name, shift_name, start_time, end_time, schedule_date, is_open_shift) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [is_open_shift ? null : employee_name, store_name, shift_name, start_time, end_time, schedule_date, is_open_shift || false]
    );
    
    console.log("✅ Schedule created successfully");
    return NextResponse.json(result.rows[0], { status: 201 });
    
  } catch (error) {
    console.error("🚨 Schedules POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}