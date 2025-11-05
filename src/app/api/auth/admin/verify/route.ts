import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const sessionResults = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionResults.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token', valid: false },
        { status: 401 }
      );
    }

    const session = sessionResults[0];

    const isExpired = new Date(session.expiresAt) <= new Date();

    if (isExpired) {
      await db.delete(sessions).where(eq(sessions.token, token));

      return NextResponse.json(
        { error: 'Token expired', valid: false },
        { status: 401 }
      );
    }

    const userResults = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, session.userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: 'User not found', valid: false },
        { status: 401 }
      );
    }

    const user = userResults[0];

    return NextResponse.json(
      {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
        expiresAt: session.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}