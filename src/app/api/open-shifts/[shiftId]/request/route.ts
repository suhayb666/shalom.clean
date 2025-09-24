import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest, { params }: { params: { shiftId: string } }) {
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
      return NextResponse.json({ error: 'Only employees can request to fill shifts' }, { status: 403 });
    }

    const shiftId = parseInt(params.shiftId, 10);
    if (isNaN(shiftId)) {
      return NextResponse.json({ error: 'Invalid Shift ID' }, { status: 400 });
    }

    await client.connect();

    // Check if the shift is open and not already requested/assigned
    const shiftResult = await client.query(
      `SELECT employee_id, status FROM schedules WHERE id = $1`,
      [shiftId]
    );

    if (shiftResult.rows.length === 0) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shiftResult.rows[0];
    if (shift.employee_id !== null || shift.status !== 'open') {
      return NextResponse.json({ error: 'Shift is not open or already requested' }, { status: 409 });
    }

    // Create a request to fill the open shift
    await client.query(
      `INSERT INTO employee_requests (employee_id, request_type, status, original_shift_id, requested_shift_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [decoded.userId, 'fill_open_shift', 'pending', shiftId, shiftId]
    );

    // Optionally, update the shift status to 'requested' immediately
    await client.query(
      `UPDATE schedules SET status = 'requested' WHERE id = $1`,
      [shiftId]
    );

    return NextResponse.json({ message: 'Shift fill request submitted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('POST /api/open-shifts/[shiftId]/request Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit shift request' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
