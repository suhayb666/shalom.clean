import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const body = await request.json();
    const { email, password, fullName, gender, dateOfBirth, phone, position } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await client.connect();

    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM employees WHERE LOWER(email) = LOWER($1)
    `;
    const existingResult = await client.query(existingUserQuery, [email]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new employee
    const insertQuery = `
      INSERT INTO employees (name, email, password, gender, date_of_birth, phone, position, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, email, gender, date_of_birth, phone, position, role, is_active
    `;

    const values = [
      fullName,
      email.toLowerCase(),
      hashedPassword,
      gender || 'Not specified',
      dateOfBirth || '1990-01-01',
      phone || null,
      position || 'employee',
      'employee', // default role
      true // is_active
    ];

    const result = await client.query(insertQuery, values);
    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      { 
        message: 'Registration successful', 
        user,
        token 
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error: unknown) {
    console.error('Registration API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await client.end();
  }
}