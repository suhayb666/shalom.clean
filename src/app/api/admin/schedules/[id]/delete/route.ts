import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    await client.connect();

    const result = await client.query(
      `DELETE FROM schedules WHERE id = $1 RETURNING id`,
      [shiftId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shift not found or not deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shift deleted successfully', id: result.rows[0].id }, { status: 200 });
  } catch (error: unknown) {
    console.error(`DELETE /api/admin/schedules/${params.id}/delete Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete shift' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
