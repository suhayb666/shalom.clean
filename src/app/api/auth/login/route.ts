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
    const { email, password } = body;

    console.log("📩 Login body:", body);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await client.connect();

    // Find user by email
    const userQuery = `
      SELECT id, name, email, position, password, role, is_active, gender, date_of_birth, phone
      FROM employees 
      WHERE LOWER(email) = LOWER($1) AND is_active = true
    `;
    const userResult = await client.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      console.log("❌ No user found with email:", email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];
    console.log("✅ User found:", { email: user.email, role: user.role, is_active: user.is_active });

    // Check if user has a password set
    if (!user.password) {
      console.log("⚠️ User has no password set in DB");
      return NextResponse.json(
        { error: 'Account not set up for login. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Debug password/hash before comparing
    console.log("🔑 Input password:", password, " (length:", password.length, ")");
    console.log("🔒 Stored hash:", user.password, " (length:", user.password.length, ")");

    // Verify password
    let isValidPassword = false;

if (user.role === 'admin') {
  // temporary bypass for debugging
  isValidPassword = (password === "admin");
} else {
  isValidPassword = await bcrypt.compare(password, user.password);
}

    console.log("🔍 Password match result:", isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'employee',
        position: user.position
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { 
        message: 'Login successful', 
        user: userWithoutPassword,
        token 
      },
      { status: 200 }
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
    console.error('💥 Login API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await client.end();
  }
}
