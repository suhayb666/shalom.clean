import { NextResponse } from "next/server";
import { startOfWeek, endOfWeek } from "date-fns";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";

export async function GET(req: Request) {
  console.log("🚀 Dashboard API called");
  
  try {
    console.log("🔐 Authenticating user...");
    const user = await getCurrentUserFromRequest(req);

    if (!user) {
      console.log("❌ Authentication failed, returning unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User authenticated:", user.name, "Role:", user.role);

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    console.log("📅 Date range:", start.toISOString().split('T')[0], "to", end.toISOString().split('T')[0]);

    if (user.role === "admin") {
      console.log("🔑 Admin view - fetching all data");
      
      // Get total employees count
      console.log("📊 Querying employees count...");
      const employeesResult = await pool.query("SELECT COUNT(*) FROM employees");
      const totalEmployees = parseInt(employeesResult.rows[0].count);
      console.log("👥 Total employees:", totalEmployees);

      // Get shifts this week count
      console.log("📊 Querying shifts this week...");
      const shiftsResult = await pool.query(
        "SELECT COUNT(*) FROM schedules WHERE schedule_date >= $1 AND schedule_date <= $2",
        [start, end]
      );
      const totalShiftsThisWeek = parseInt(shiftsResult.rows[0].count);
      console.log("📋 Shifts this week:", totalShiftsThisWeek);

      // Get unavailabilities count
      console.log("📊 Querying unavailabilities...");
      const unavailResult = await pool.query("SELECT COUNT(*) FROM unavailabilities");
      const unavailCount = parseInt(unavailResult.rows[0].count);
      console.log("🚫 Unavailabilities:", unavailCount);

      // Calculate fill rate
      const fillRatePct =
        totalShiftsThisWeek > 0
          ? Math.round(
              (totalShiftsThisWeek / (totalShiftsThisWeek + unavailCount)) * 100
            )
          : 0;
      console.log("📈 Fill rate:", fillRatePct + "%");

      const result = {
        totalEmployees,
        totalShiftsThisWeek,
        fillRatePct,
        unavailCount,
      };
      
      console.log("✅ Returning admin data:", result);
      return NextResponse.json(result);
      
    } else {
      console.log("👤 Employee view - fetching user data");
      
      // Get user shifts this week
      console.log("📊 Querying user shifts...");
      const userShiftsResult = await pool.query(
        "SELECT COUNT(*) FROM schedules WHERE employee_name = $1 AND schedule_date >= $2 AND schedule_date <= $3",
        [user.name, start, end]
      );
      const userShiftsThisWeek = parseInt(userShiftsResult.rows[0].count);
      console.log("📋 User shifts this week:", userShiftsThisWeek);

      // Get user unavailabilities
      console.log("📊 Querying user unavailabilities...");
      const userUnavailResult = await pool.query(
        "SELECT COUNT(*) FROM unavailabilities WHERE employee_name = $1",
        [user.name]
      );
      const userUnavailCount = parseInt(userUnavailResult.rows[0].count);
      console.log("🚫 User unavailabilities:", userUnavailCount);

      const result = {
        userShiftsThisWeek,
        userUnavailCount,
      };
      
      console.log("✅ Returning employee data:", result);
      return NextResponse.json(result);
    }
    
  } catch (error: unknown) {
    console.error("🚨 Dashboard API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}