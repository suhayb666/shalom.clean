import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// -------------------- GET PROFILE --------------------
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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    await client.connect();
    const result = await client.query(
      `SELECT id, name, email, position, role, is_active, gender, date_of_birth, phone
       FROM employees WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error: unknown) {
    console.error('GET /api/auth/me Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}

// -------------------- UPDATE PROFILE --------------------
export async function PUT(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const body = await request.json();

    const { name, phone, gender, date_of_birth, position, password } = body;

    await client.connect();

    let query = `
      UPDATE employees 
      SET name = $1, phone = $2, gender = $3, date_of_birth = $4, position = $5
    `;
    const values: any[] = [name, phone, gender, date_of_birth, position, decoded.userId];

    // If user wants to update password
    if (password && password.length >= 4) {
      const hashedPassword = await bcrypt.hash(password, 12);
      query += `, password = $6 WHERE id = $7 RETURNING id, name, email, role, phone, gender, date_of_birth, position`;
      values.splice(5, 0, hashedPassword); // insert password at correct index
    } else {
      query += ` WHERE id = $6 RETURNING id, name, email, role, phone, gender, date_of_birth, position`;
    }

    const result = await client.query(query, values);

    return NextResponse.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (error: unknown) {
    console.error('PUT /api/auth/me Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
