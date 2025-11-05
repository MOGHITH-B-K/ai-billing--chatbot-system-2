import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(customers);

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(customers.name, searchTerm),
          like(customers.phone, searchTerm),
          like(customers.address, searchTerm)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, address } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Name is required and must be a non-empty string',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Phone is required and must be a non-empty string',
          code: 'MISSING_PHONE'
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedPhone = phone.trim();
    const sanitizedAddress = address ? address.trim() : null;

    // Check if customer with phone already exists
    const existingCustomer = await db.select()
      .from(customers)
      .where(eq(customers.phone, sanitizedPhone))
      .limit(1);

    const timestamp = new Date().toISOString();

    if (existingCustomer.length > 0) {
      // Update existing customer
      const updated = await db.update(customers)
        .set({
          name: sanitizedName,
          address: sanitizedAddress,
          updatedAt: timestamp
        })
        .where(eq(customers.phone, sanitizedPhone))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new customer
      const newCustomer = await db.insert(customers)
        .values({
          name: sanitizedName,
          phone: sanitizedPhone,
          address: sanitizedAddress,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();

      return NextResponse.json(newCustomer[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { 
          error: 'A customer with this phone number already exists',
          code: 'DUPLICATE_PHONE'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}