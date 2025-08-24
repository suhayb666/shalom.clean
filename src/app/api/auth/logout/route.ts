import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error: unknown) {
    console.error('Logout API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}