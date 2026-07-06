import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Wrap database lookups in precise try/catches to isolate the issue
    try {
      const existing = await pool.query(
        'SELECT name, email FROM users WHERE email = $1 OR name = $2',
        [email, name]
      );

      if (existing.rows.length > 0) {
        const matchedUser = existing.rows[0];
        if (matchedUser.email === email) {
          return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
        }
        if (matchedUser.name === name) {
          return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
        }
      }
    } catch (dbFindError: any) {
      console.error("🔴 DB SEARCH FAILED:", dbFindError.message);
      return NextResponse.json({ error: `Database Search Error: ${dbFindError.message}` }, { status: 500 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
      );
      return NextResponse.json({ user: result.rows[0] }, { status: 201 });
    } catch (dbInsertError: any) {
      console.error("🔴 DB INSERTION FAILED:", dbInsertError.message);
      return NextResponse.json({ error: `Database Insert Error: ${dbInsertError.message}` }, { status: 500 });
    }

  } catch (err: any) {
    console.error("🔴 GLOBAL ERROR:", err);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}