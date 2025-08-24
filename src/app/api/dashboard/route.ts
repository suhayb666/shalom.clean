import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

// Utility: get logged-in user from your /api/auth/me endpoint
async function getCurrentUser(cookies: string | null) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/me`,
      {
        headers: { cookie: cookies || "" },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const cookies = req.headers.get("cookie");
    const user = await getCurrentUser(cookies);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    if (user.role === "admin") {
      // ---------------- Admin View ----------------
      const totalEmployees = await prisma.employees.count();

      const totalShiftsThisWeek = await prisma.schedules.count({
        where: {
          schedule_date: { gte: start, lte: end },
        },
      });

      const unavailCount = await prisma.unavailabilities.count();

      const fillRatePct =
        totalShiftsThisWeek > 0
          ? Math.round(
              (totalShiftsThisWeek / (totalShiftsThisWeek + unavailCount)) * 100
            )
          : 0;

      return NextResponse.json({
        totalEmployees,
        totalShiftsThisWeek,
        fillRatePct,
        unavailCount,
      });
    } else {
      // ---------------- Employee View ----------------
      const userShiftsThisWeek = await prisma.schedules.count({
        where: {
          employee_name: user.name,
          schedule_date: { gte: start, lte: end },
        },
      });

      const userUnavailCount = await prisma.unavailabilities.count({
        where: { employee_name: user.name },
      });

      return NextResponse.json({
        userShiftsThisWeek,
        userUnavailCount,
      });
    }
  } catch (error: unknown) {
    console.error("Dashboard API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
