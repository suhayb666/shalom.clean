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

    if (decoded.role === 'admin') {
      // Admins can see all open shifts
      await client.connect();
      const result = await client.query(
        `SELECT s.id, s.store_name, s.shift_name, s.start_time, s.end_time, s.schedule_date, e.name as assigned_employee_name
         FROM schedules s
         LEFT JOIN employees e ON s.employee_id = e.id
         WHERE s.employee_id IS NULL AND s.status = 'open'
         ORDER BY s.schedule_date, s.start_time`
      );
      return NextResponse.json(result.rows);
    } else {
      // Employees can only see open shifts that they are NOT already assigned to
      await client.connect();
      const result = await client.query(
        `SELECT s.id, s.store_name, s.shift_name, s.start_time, s.end_time, s.schedule_date
         FROM schedules s
         WHERE s.employee_id IS NULL AND s.status = 'open'
         AND NOT EXISTS (
           SELECT 1 FROM schedules sub WHERE sub.id = s.id AND sub.employee_id = $1
         )
         ORDER BY s.schedule_date, s.start_time`,
        [decoded.userId]
      );
      return NextResponse.json(result.rows);
    }
  } catch (error: unknown) {
    console.error('GET /api/open-shifts Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch open shifts' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
