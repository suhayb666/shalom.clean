import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  try {
    await client.connect();

    const employeesToInsert = [
      { name: "Aaron Silverstein", gender: "Male", date_of_birth: "1990-01-15" },
      { name: "Chris Cruz", gender: "Male", date_of_birth: "1985-05-20" },
      { name: "Daniel Shachar", gender: "Male", date_of_birth: "1992-11-01" },
      { name: "Eitan Jalali", gender: "Male", date_of_birth: "1988-03-25" },
      { name: "Elie Noorani", gender: "Male", date_of_birth: "1995-07-10" },
      { name: "Etai Schachar", gender: "Male", date_of_birth: "1993-09-05" },
      { name: "Jay Summers", gender: "Male", date_of_birth: "1980-12-30" },
      { name: "Joseph Sarir", gender: "Male", date_of_birth: "1991-02-18" },
      { name: "Moshe Shaoulian", gender: "Male", date_of_birth: "1987-06-22" },
      { name: "Ronell Zahir", gender: "Male", date_of_birth: "1994-04-12" },
      { name: "Simcha Mahfouda", gender: "Female", date_of_birth: "1989-10-03" },
      { name: "Yehuda Beck", gender: "Male", date_of_birth: "1983-08-08" },
      { name: "Yoni Miretsky", gender: "Male", date_of_birth: "1996-01-28" },
      { name: "Zev Rothenberg", gender: "Male", date_of_birth: "1986-07-07" },
    ];

    let insertedCount = 0;
    for (const employee of employeesToInsert) {
      // Check if employee already exists to prevent duplicates
      const checkRes = await client.query('SELECT id FROM employees WHERE name = $1 AND date_of_birth = $2', [employee.name, employee.date_of_birth]);
      if (checkRes.rows.length === 0) {
        await client.query(
          "INSERT INTO employees (name, gender, date_of_birth) VALUES ($1, $2, $3)",
          [employee.name, employee.gender, employee.date_of_birth]
        );
        insertedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully seeded ${insertedCount} new employees.` });
  } catch (err) {
    const error = err as Error;
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed database" }, { status: 500 });
  }
}