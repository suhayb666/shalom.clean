import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await client.connect();

    const query = `
      SELECT er.id, er.request_type, er.status, er.request_date, er.start_date, er.end_date,
             s_orig.shift_name as original_shift_name, s_orig.schedule_date as original_shift_date,
             s_req.shift_name as requested_shift_name, s_req.schedule_date as requested_shift_date,
             e_req.name as requesting_employee_name, swe.name as swap_with_employee_name, er.remarks, er.admin_notes
      FROM employee_requests er
      LEFT JOIN schedules s_orig ON er.original_shift_id = s_orig.id
      LEFT JOIN schedules s_req ON er.requested_shift_id = s_req.id
      LEFT JOIN employees e_req ON er.employee_id = e_req.id
      LEFT JOIN employees swe ON er.swap_with_employee_id = swe.id
      ORDER BY er.request_date DESC
    `;

    const result = await client.query(query);

    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    console.error('GET /api/admin/employee-requests Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch employee requests' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
