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

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { employee_id, shift_id, remarks } = body;

    if (!employee_id || !shift_id) {
      return NextResponse.json({ error: 'Employee ID and Shift ID are required' }, { status: 400 });
    }

    await client.connect();

    // Verify the shift is open and exists
    const shiftResult = await client.query(
      `SELECT id FROM schedules WHERE id = $1 AND employee_id IS NULL AND status = 'open'`,
      [shift_id]
    );
    if (shiftResult.rows.length === 0) {
      return NextResponse.json({ error: 'Open shift not found' }, { status: 404 });
    }

    // Verify the employee exists
    const employeeResult = await client.query(
      `SELECT id FROM employees WHERE id = $1`,
      [employee_id]
    );
    if (employeeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create an 'admin_offer_shift' request
    const result = await client.query(
      `INSERT INTO employee_requests (employee_id, request_type, status, original_shift_id, requested_shift_id, remarks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, 'admin_offer_shift', 'pending', shift_id, shift_id, remarks]
    );

    return NextResponse.json({ message: 'Shift offer sent successfully', request: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/admin/send-shift-request Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send shift offer' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
