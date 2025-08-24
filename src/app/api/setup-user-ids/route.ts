// src/app/api/setup-user-ids/route.ts
import { NextResponse } from "next/server";
import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function POST() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    // First, check if password and role columns exist, if not add them
    try {
      await client.query(`
        ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS password VARCHAR(255),
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
      console.log('Added password, role, and is_active columns');
    } catch (error) {
      console.log('Columns may already exist:', error);
    }

    // Get all employees
    const employeesResult = await client.query(
      'SELECT id, name, email FROM employees WHERE password IS NULL OR password = \'\''
    );
    
    const employees = employeesResult.rows;
    console.log(`Found ${employees.length} employees to update`);

    if (employees.length === 0) {
      return NextResponse.json({ 
        message: 'No employees found or all employees already have passwords set',
        updated: 0 
      });
    }

    // Hash the default password
    const defaultPassword = '12345678';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const updatedEmployees = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Generate email from name
        const generatedEmail = generateEmailFromName(employee.name);
        
        // Update employee with generated email and password
        await client.query(`
          UPDATE employees 
          SET 
            email = COALESCE(NULLIF(email, ''), $1),
            password = $2,
            role = COALESCE(role, 'employee'),
            is_active = COALESCE(is_active, true)
          WHERE id = $3
        `, [generatedEmail, hashedPassword, employee.id]);

        updatedEmployees.push({
          id: employee.id,
          name: employee.name,
          email: generatedEmail,
          originalEmail: employee.email
        });

      } catch (error) {
        console.error(`Error updating employee ${employee.name}:`, error);
        errors.push({
          name: employee.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedEmployees.length} employees`,
      updated: updatedEmployees.length,
      employees: updatedEmployees,
      errors: errors.length > 0 ? errors : undefined,
      defaultPassword: defaultPassword // Remove this in production!
    });

  } catch (error) {
    console.error('Setup User IDs Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await client.end();
  }
}

// Helper function to generate email from full name
function generateEmailFromName(fullName: string, id?: number): string {
  if (!fullName || typeof fullName !== "string") {
    return `unknown${id ? id : ""}@shalom.com`;
  }

  // Normalize & clean name
  const nameParts = fullName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "") // only letters & spaces
    .split(/\s+/)
    .filter(Boolean);

  let email = "unknown";

  if (nameParts.length === 1) {
    email = nameParts[0];
  } else if (nameParts.length === 2) {
    email = `${nameParts[0]}.${nameParts[1]}`;
  } else if (nameParts.length > 2) {
    email = `${nameParts[0]}.${nameParts[nameParts.length - 1]}`;
  }

  // Add ID suffix if duplicate risk
  return `${email}${id ? "." + id : ""}@shalom.com`;
}


// GET method to preview what emails would be generated (without making changes)
export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    
    // Get all employees
    const result = await client.query('SELECT id, name, email FROM employees');
    const employees = result.rows;

    const preview = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      currentEmail: employee.email,
      generatedEmail: generateEmailFromName(employee.name)
    }));

    return NextResponse.json({
      message: `Preview of ${employees.length} employees`,
      employees: preview
    });

  } catch (error) {
    console.error('Preview Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await client.end();
  }
}