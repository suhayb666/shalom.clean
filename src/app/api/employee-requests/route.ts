import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
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

    if (decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Only employees can submit requests' }, { status: 403 });
    }

    const body = await request.json();
    const { request_type, start_date, end_date, original_shift_id, requested_shift_id, swap_with_employee_id, remarks } = body;

    if (!request_type) {
      return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
    }

    await client.connect();

    let query = `INSERT INTO employee_requests (employee_id, request_type, status, request_date, start_date, end_date, original_shift_id, requested_shift_id, swap_with_employee_id, remarks) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9) RETURNING *`;
    let values: any[] = [decoded.userId, request_type, 'pending', start_date, end_date, original_shift_id, requested_shift_id, swap_with_employee_id, remarks];

    // Basic validation based on request_type
    switch (request_type) {
      case 'time_off':
        if (!start_date || !end_date) {
          return NextResponse.json({ error: 'Start date and end date are required for time off requests' }, { status: 400 });
        }
        break;
      case 'shift_swap':
        if (!original_shift_id) {
          return NextResponse.json({ error: 'Original shift ID is required for shift swap requests' }, { status: 400 });
        }
        // Could also validate requested_shift_id or swap_with_employee_id here if required for the initial request
        break;
      case 'miss_shift':
        if (!original_shift_id) {
          return NextResponse.json({ error: 'Original shift ID is required for miss shift requests' }, { status: 400 });
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const result = await client.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/employee-requests Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit employee request' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
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
      LEFT JOIN schedules s_orig ON er.original_shift_id = s_orig.id
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
