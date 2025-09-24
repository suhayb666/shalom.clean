import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest, { params }: { params: { requestId: string, action: string } }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, role: string };

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const requestId = parseInt(params.requestId, 10);
    const action = params.action;

    if (isNaN(requestId) || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid Request ID or Action' }, { status: 400 });
    }

    const body = await request.json();
    const { admin_notes } = body;

    await client.connect();
    await client.query("BEGIN"); // Start transaction

    // Fetch the request details
    const requestResult = await client.query(
      `SELECT employee_id, request_type, status, original_shift_id, requested_shift_id, swap_with_employee_id
       FROM employee_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestDetails = requestResult.rows[0];
    if (requestDetails.status !== 'pending') {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
    }

    // Update the request status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await client.query(
      `UPDATE employee_requests SET status = $1, admin_notes = $2 WHERE id = $3`,
      [newStatus, admin_notes, requestId]
    );

    // Perform actions based on request type if approved
    if (action === 'approve') {
      switch (requestDetails.request_type) {
        case 'fill_open_shift':
          if (requestDetails.requested_shift_id) {
            // Assign the employee to the requested shift and set status to 'assigned'
            await client.query(
              `UPDATE schedules SET employee_id = $1, status = 'assigned' WHERE id = $2 AND employee_id IS NULL AND status = 'open'`,
              [requestDetails.employee_id, requestDetails.requested_shift_id]
            );
            // If the update affected 0 rows, it means the shift was taken by someone else or no longer open.
            if (client.query('SELECT ROW_COUNT()').rows[0].row_count === 0) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: 'Shift was already taken or no longer open.' }, { status: 409 });
            }
          }
          break;
        case 'miss_shift':
          if (requestDetails.original_shift_id) {
            // Set the original shift to open status, and remove employee_id
            await client.query(
              `UPDATE schedules SET employee_id = NULL, status = 'open' WHERE id = $1`,
              [requestDetails.original_shift_id]
            );
          }
          break;
        case 'shift_swap':
          // This is more complex and would need more logic:
          // 1. If swap_with_employee_id is present, swap employee_id between original_shift_id and requested_shift_id (if available).
          // 2. If requested_shift_id is an open shift, assign employee_id to it and set original_shift_id to open.
          // For now, we will just approve the request and leave the complex shift logic for later.
          console.log("Shift swap approved - manual intervention may be needed.");
          break;
        case 'time_off':
          // Time off requests don't directly modify shifts, just mark the employee as unavailable
          // (which is already handled by the unavailabilities table if it's used for this purpose)
          console.log("Time off request approved.");
          break;
      }
    }

    await client.query("COMMIT"); // Commit transaction
    return NextResponse.json({ message: `Request ${action}ed successfully.` }, { status: 200 });
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {}); // Rollback on error
    console.error(`POST /api/admin/employee-requests/${params.requestId}/${params.action} Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
