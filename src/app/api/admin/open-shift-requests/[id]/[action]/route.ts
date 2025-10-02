import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth-utils";

export async function POST(
  req: NextRequest,
  context: { params: { id: string; action: "approve" | "reject" } }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = parseInt(context.params.id);
    const action = context.params.action;
    const { admin_notes } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await pool.query("BEGIN");

    // 1. Update the open_shift_request status and admin notes
    const updateRequestQuery = `
      UPDATE open_shift_requests
      SET status = $1, admin_notes = $2
      WHERE id = $3 AND status = 'pending'
      RETURNING schedule_id, requester_employee_id;
    `;
    const updateRequestResult = await pool.query(updateRequestQuery, [
      action === "approve" ? "approved" : "rejected",
      admin_notes,
      requestId,
    ]);

    if (updateRequestResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { error: "Open shift request not found or already processed." },
        { status: 404 }
      );
    }

    const { schedule_id, requester_employee_id } = updateRequestResult.rows[0];

    if (action === "approve") {
      // 2. Assign the employee to the schedule
      const assignShiftQuery = `
        UPDATE schedules
        SET employee_id = $1, employee_name = (SELECT name FROM employees WHERE id = $1), is_open_shift = FALSE, status = 'assigned'
        WHERE id = $2 AND is_open_shift = TRUE AND employee_id IS NULL;
      `;
      const assignShiftResult = await pool.query(assignShiftQuery, [
        requester_employee_id,
        schedule_id,
      ]);

      if (assignShiftResult.rowCount === 0) {
        await pool.query("ROLLBACK");
        return NextResponse.json(
          { error: "Failed to assign employee to shift. It might no longer be an open shift or already assigned." },
          { status: 400 }
        );
      }

      // 3. Reject any other pending requests for the same schedule
      const rejectOtherRequestsQuery = `
        UPDATE open_shift_requests
        SET status = 'rejected', admin_notes = $1
        WHERE schedule_id = $2 AND id != $3 AND status = 'pending';
      `;
      await pool.query(rejectOtherRequestsQuery, [
        "Rejected as another request for this shift was approved.",
        schedule_id,
        requestId,
      ]);
    }

    await pool.query("COMMIT");
    return NextResponse.json({ message: `Request ${action}d successfully` });
  } catch (err) {
    await pool.query("ROLLBACK");
    const error = err as Error;
    console.error(`Error ${context.params.action}ing open shift request:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
