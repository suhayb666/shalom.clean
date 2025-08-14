import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ changed to named import

export async function GET() {
  try {
    const totalEmployees = await prisma.employees.count();
    return NextResponse.json({ totalEmployees });
  } catch (error: unknown) {
    console.error("Test Prisma Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
