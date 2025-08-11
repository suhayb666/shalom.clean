import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalEmployees = await prisma.employees.count();
    return NextResponse.json({ totalEmployees });
  } catch (error) {
    console.error("Test Prisma Error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}