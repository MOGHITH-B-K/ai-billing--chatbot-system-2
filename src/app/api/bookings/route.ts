import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { calendarBookings } from '@/db/schema';
import { eq, gte, lte, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(calendarBookings);

    // Apply date filtering
    if (date) {
      query = query.where(eq(calendarBookings.bookingDate, date));
    } else if (startDate && endDate) {
      query = query.where(
        and(
          gte(calendarBookings.bookingDate, startDate),
          lte(calendarBookings.bookingDate, endDate)
        )
      );
    } else if (startDate) {
      query = query.where(gte(calendarBookings.bookingDate, startDate));
    } else if (endDate) {
      query = query.where(lte(calendarBookings.bookingDate, endDate));
    }

    // Sort by bookingDate ascending
    const bookings = await query.orderBy(asc(calendarBookings.bookingDate));

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingDate, billType, customerName, customerPhone, notes } = body;

    // Validate required fields
    if (!bookingDate) {
      return NextResponse.json(
        { error: 'bookingDate is required', code: 'MISSING_BOOKING_DATE' },
        { status: 400 }
      );
    }

    if (!billType) {
      return NextResponse.json(
        { error: 'billType is required', code: 'MISSING_BILL_TYPE' },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: 'customerName is required', code: 'MISSING_CUSTOMER_NAME' },
        { status: 400 }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: 'customerPhone is required', code: 'MISSING_CUSTOMER_PHONE' },
        { status: 400 }
      );
    }

    // Validate billType
    if (billType !== 'sales' && billType !== 'rental') {
      return NextResponse.json(
        {
          error: 'billType must be either "sales" or "rental"',
          code: 'INVALID_BILL_TYPE',
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      bookingDate,
      billType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes ? notes.trim() : null,
      createdAt: new Date().toISOString(),
    };

    // Insert booking
    const newBooking = await db
      .insert(calendarBookings)
      .values(insertData)
      .returning();

    return NextResponse.json(newBooking[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const bookingId = parseInt(id);

    // Check if booking exists
    const existing = await db
      .select()
      .from(calendarBookings)
      .where(eq(calendarBookings.id, bookingId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete booking
    const deleted = await db
      .delete(calendarBookings)
      .where(eq(calendarBookings.id, bookingId))
      .returning();

    return NextResponse.json(
      {
        message: 'Booking deleted successfully',
        booking: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}