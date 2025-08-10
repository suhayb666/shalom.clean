import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return NextResponse.json(
      { success: false, error: "DATABASE_URL is not set in environment." },
      { status: 500 }
    );
  }

  // Strip accidental wrapping quotes
  const connectionString = raw.replace(/^['"]|['"]$/g, "");
  const hadQuotes = connectionString !== raw;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query("SELECT NOW() AS now");
    const now = result.rows?.[0]?.now ?? null;

    // Mask secret in response
    const masked = maskConnectionString(connectionString);

    return NextResponse.json({
      success: true,
      message: "Successfully connected to the database.",
      now,
      connection: masked,
      note: hadQuotes ? "Removed wrapping quotes from DATABASE_URL automatically" : undefined,
    });
  } catch (err) {
    const anyErr = err as any;
    const message = (anyErr?.message as string) || String(err);
    const code = anyErr?.code as string | undefined;
    const masked = maskConnectionString(connectionString);
    return NextResponse.json(
      { success: false, error: message, code, connection: masked },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}

function maskConnectionString(uri: string): string {
  try {
    const u = new URL(uri);
    const username = u.username ? "***" : "";
    const password = u.password ? "***" : "";
    u.username = username;
    u.password = password;
    return u.toString();
  } catch {
    return "***";
  }
}