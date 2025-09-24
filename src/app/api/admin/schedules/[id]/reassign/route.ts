import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const shiftId = parseInt(params.id, 10);
    if (isNaN(shiftId)) {
      return NextResponse.json({ error: 'Invalid Shift ID' }, { status: 400 });
    }

    const body = await request.json();
    const { new_employee_id } = body;

    if (!new_employee_id) {
      return NextResponse.json({ error: 'New Employee ID is required' }, { status: 400 });
    }

    await client.connect();

    // Verify the new employee exists
    const employeeCheck = await client.query(
      `SELECT id FROM employees WHERE id = $1`,
      [new_employee_id]
    );
    if (employeeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'New employee not found' }, { status: 404 });
    }

    const result = await client.query(
      `UPDATE schedules SET employee_id = $1, status = 'assigned' WHERE id = $2 RETURNING *`,
      [new_employee_id, shiftId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shift not found or not updated' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shift reassigned successfully', shift: result.rows[0] }, { status: 200 });
  } catch (error: unknown) {
    console.error(`PUT /api/admin/schedules/${params.id}/reassign Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reassign shift' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
