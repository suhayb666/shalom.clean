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
    const status = searchParams.get("status");
    const isAdmin = user.role === "admin";

    let query = `
      SELECT osr.id as request_id, osr.requester_employee_id,
             osr.status as request_status, osr.schedule_id,
             s.schedule_date, s.shift_name, s.store_name
      FROM open_shift_requests osr
      JOIN schedules s ON osr.schedule_id = s.id
    `;
    const values: any[] = [];
    const conditions: string[] = [];

    if (!isAdmin) {
      conditions.push("osr.requester_employee_id = $1");
      values.push(user.id);
    } else if (employeeId) { // Admin can filter by employee_id
      conditions.push("osr.requester_employee_id = $1");
      values.push(employeeId);
    }

    if (status) {
      conditions.push(`osr.status = $${values.length + 1}`);
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY osr.id DESC";
    
    console.log("Executing query:", query);
    console.log("With values:", values);

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching open shift requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schedule_id, employee_id, remarks } = await req.json();

    if (!schedule_id || !employee_id) {
      return NextResponse.json({ error: "Missing required fields: schedule_id, employee_id" }, { status: 400 });
    }

    // Check if the shift is an open shift and not already requested/assigned
    const shiftCheck = await pool.query(
      "SELECT is_open_shift, employee_id FROM schedules WHERE id = $1",
      [schedule_id]
    );

    if (shiftCheck.rows.length === 0) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    const shift = shiftCheck.rows[0];
    if (!shift.is_open_shift) {
      return NextResponse.json({ error: "This is not an open shift." }, { status: 400 });
    }
    if (shift.employee_id !== null) {
      return NextResponse.json({ error: "This open shift is already assigned." }, { status: 400 });
    }

    // Check if the employee has already requested this shift
    const existingRequest = await pool.query(
      "SELECT id FROM open_shift_requests WHERE schedule_id = $1 AND requester_employee_id = $2 AND status = 'pending'",
      [schedule_id, employee_id]
    );

    if (existingRequest.rows.length > 0) {
      return NextResponse.json({ error: "You have already requested this shift." }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO open_shift_requests (schedule_id, requester_employee_id, status, remarks) VALUES ($1, $2, 'pending', $3) RETURNING *",
      [schedule_id, employee_id, remarks]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error("Error submitting open shift request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
