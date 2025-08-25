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
      SELECT id, employee_name, store_name, shift_name, start_time, end_time, schedule_date
      FROM schedules
    `;
    const values: any[] = [];

    if (me === "true") {
      query += " WHERE employee_name = $1 ORDER BY schedule_date DESC, id ASC";
      values.push(user.name);
      console.log("📋 Fetching schedules for user:", user.name);
    } else {
      query += " ORDER BY schedule_date DESC, id ASC";
      console.log("📋 Fetching all schedules");
    }

    const result = await pool.query(query, values);
    console.log("✅ Found", result.rows.length, "schedules");
    
    return NextResponse.json(result.rows);
    
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
    
    const { employee_name, store_name, shift_name, start_time, end_time, schedule_date } = await req.json();

    if (!employee_name || !store_name || !shift_name || !start_time || !end_time || !schedule_date) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: employee_name, store_name, shift_name, start_time, end_time, schedule_date" },
        { status: 400 }
      );
    }

    console.log("📝 Creating schedule for:", employee_name);
    
    const result = await pool.query(
      "INSERT INTO schedules (employee_name, store_name, shift_name, start_time, end_time, schedule_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [employee_name, store_name, shift_name, start_time, end_time, schedule_date]
    );
    
    console.log("✅ Schedule created successfully");
    return NextResponse.json(result.rows[0], { status: 201 });
    
  } catch (error) {
    console.error("🚨 Schedules POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}