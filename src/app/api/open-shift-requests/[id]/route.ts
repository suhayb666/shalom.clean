import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    console.log("🚀 Open Shift Request PUT called");

    const user = await getCurrentUserFromRequest(req);

    if (!user || user.role !== "admin") {
      console.log("❌ Unauthorized access");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;
    const { status, assigned_employee_id } = await req.json();

    if (!status) {
      console.log("❌ Missing required field: status");
      return NextResponse.json(
        { error: "Missing required field: status" },
        { status: 400 }
      );
    }

    let query = "UPDATE employee_requests SET status = $1 WHERE id = $2 RETURNING *";
    let values = [status, id];

    if (status === "approved" && assigned_employee_id) {
      // Update the schedule to assign the employee and remove open shift status
      await pool.query(
        "UPDATE schedules SET employee_id = $1, is_open_shift = FALSE, status = $2 WHERE id = (SELECT schedule_id FROM employee_requests WHERE id = $3)",
        [assigned_employee_id, "assigned", id]
      );
      // Also update the employee_name in the schedules table
      const employeeResult = await pool.query("SELECT name FROM employees WHERE id = $1", [assigned_employee_id]);
      const employee_name = employeeResult.rows[0]?.name;

      if (employee_name) {
        await pool.query(
          "UPDATE schedules SET employee_name = $1 WHERE id = (SELECT schedule_id FROM employee_requests WHERE id = $2)",
          [employee_name, id]
        );
      }
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Open shift request not found" }, { status: 404 });
    }

    console.log(`✅ Open shift request ${id} updated to ${status}`);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("🚨 Open Shift Request PUT Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
