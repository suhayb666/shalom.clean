import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  try {
    const totalEmployees = await prisma.employees.count();

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const totalShiftsThisWeek = await prisma.schedules.count({
      where: {
        schedule_date: {
          gte: start,
          lte: end,
        },
      },
    });

    const unavailCount = await prisma.unavailabilities.count();

    const fillRatePct =
      totalShiftsThisWeek > 0
        ? Math.round((totalShiftsThisWeek / (totalShiftsThisWeek + unavailCount)) * 100)
        : 0;

    return NextResponse.json({
      totalEmployees,
      totalShiftsThisWeek,
      fillRatePct,
      unavailCount,
    });
  } catch (error: unknown) {
    console.error('Dashboard API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}