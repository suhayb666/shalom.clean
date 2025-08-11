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
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}