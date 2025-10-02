import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || user.role === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request_type, schedule_id, start_date, end_date, remarks, swap_with_employee_id } = await req.json();

    if (!request_type || !schedule_id) {
      return NextResponse.json({ error: "Missing required fields: request_type, schedule_id" }, { status: 400 });
    }

    let query = "";
    let values: any[] = [];

    switch (request_type) {
      case "time_off":
        if (!start_date || !end_date || !remarks) {
          return NextResponse.json({ error: "Missing required fields for time_off: start_date, end_date, remarks" }, { status: 400 });
        }
        query = `
          INSERT INTO employee_requests (employee_id, request_type, schedule_id, request_date, start_date, end_date, remarks, status)
          VALUES ($1, $2, $3, NOW(), $4, $5, $6, 'pending')
          RETURNING *;
        `;
        values = [user.id, request_type, schedule_id, start_date, end_date, remarks];
        break;
      case "miss_shift":
        if (!remarks) {
          return NextResponse.json({ error: "Missing required fields for miss_shift: remarks" }, { status: 400 });
        }
        query = `
          INSERT INTO employee_requests (employee_id, request_type, schedule_id, request_date, remarks, status)
          VALUES ($1, $2, $3, NOW(), $4, 'pending')
          RETURNING *;
        `;
        values = [user.id, request_type, schedule_id, remarks];
        break;
      case "shift_swap":
        if (!swap_with_employee_id || !remarks) {
          return NextResponse.json({ error: "Missing required fields for shift_swap: swap_with_employee_id, remarks" }, { status: 400 });
        }
        // Optional: Check if the swap_with_employee_id exists and is an employee
        const employeeCheck = await pool.query(
          "SELECT id, name FROM employees WHERE id = $1",
          [swap_with_employee_id]
        );
        if (employeeCheck.rows.length === 0) {
          return NextResponse.json({ error: "Swap with employee not found" }, { status: 404 });
        }

        query = `
          INSERT INTO employee_requests (employee_id, request_type, schedule_id, request_date, swap_with_employee_id, remarks, status)
          VALUES ($1, $2, $3, NOW(), $4, $5, 'pending')
          RETURNING *;
        `;
        values = [user.id, request_type, schedule_id, swap_with_employee_id, remarks];
        break;
      default:
        return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error submitting employee request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, role: string };

    await client.connect();

    let query = `
      SELECT er.id, er.request_type, er.status, er.request_date, er.start_date, er.end_date,
             s_orig.shift_name as original_shift_name, s_orig.schedule_date as original_shift_date,
             s_req.shift_name as requested_shift_name, s_req.schedule_date as requested_shift_date,
             swe.name as swap_with_employee_name, er.remarks, er.admin_notes
      FROM employee_requests er
      LEFT JOIN schedules s_orig ON er.schedule_id = s_orig.id
      LEFT JOIN schedules s_req ON er.requested_shift_id = s_req.id
      LEFT JOIN employees swe ON er.swap_with_employee_id = swe.id
    `;
    let values: any[] = [];

    if (decoded.role === 'employee') {
      query += ` WHERE er.employee_id = $1 ORDER BY er.request_date DESC`;
      values.push(decoded.userId);
    } else if (decoded.role === 'admin') {
      // Admins can view all requests
      query += ` ORDER BY er.request_date DESC`;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await client.query(query, values);

    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    console.error('GET /api/employee-requests Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch employee requests' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
