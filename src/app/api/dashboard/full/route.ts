import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });

  // Stats for dashboard
  const stats = await prisma.dashboardStats.findFirst({
    where: { userId: user?.id },
  });

  // User schedules
  const schedules = await prisma.schedules.findMany({
    where: { employee_name: user?.name },
  });

  // User unavailabilities
  const unavailabilities = await prisma.unavailabilities.findMany({
    where: { employee_name: user?.name },
  });

  return NextResponse.json({
    user,
    stats,
    schedules,
    unavailabilities,
  });
}
