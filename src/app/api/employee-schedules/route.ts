import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const date = searchParams.get("date");

    if (!employeeId) {
      return NextResponse.json({ error: "Missing required parameter: employee_id" }, { status: 400 });
    }

    let query = `
      SELECT id, employee_name, store_name, shift_name, start_time, end_time, schedule_date, status
      FROM schedules
      WHERE employee_id = $1
    `;
    const values: any[] = [employeeId];

    if (date) {
      query += ` AND schedule_date = $2`;
      values.push(date);
    }

    query += ` ORDER BY schedule_date DESC, start_time ASC`;

    const result = await pool.query(query, values);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error("Employee schedules GET Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}