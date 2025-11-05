import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required', code: 'MISSING_USERNAME' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    // Query admin_users table for matching username
    const userResult = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    // Check if user exists
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Compare passwords (plain text comparison)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = randomUUID();

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create session record
    const newSession = await db
      .insert(sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Return success response with token and user info
    return NextResponse.json(
      {
        token: newSession[0].token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}