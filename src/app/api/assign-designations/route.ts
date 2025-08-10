import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const designations = [
    "Shift Manager",
    "Kitchen Manager",
    "Cashier",
    "Counter Staff",
    "Pizza Maker",
    "Dishwasher",
  ];

  try {
    await client.connect();

    // Fetch existing employees ordered by ID to ensure consistent assignment
    const employeesRes = await client.query("SELECT id, name FROM employees ORDER BY id ASC");
    const employees = employeesRes.rows;

    let updatedCount = 0;
    for (let i = 0; i < designations.length && i < employees.length; i++) {
      const employee = employees[i];
      const designation = designations[i];
      
      await client.query(
        "UPDATE employees SET position = $1 WHERE id = $2",
        [designation, employee.id]
      );
      updatedCount++;
    }

    return NextResponse.json({ success: true, message: `Successfully assigned designations to ${updatedCount} employees.` });
  } catch (err) {
    const error = err as Error;
    console.error("Error assigning designations:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to assign designations" }, { status: 500 });
  } finally {
    await client.end();
  }
}