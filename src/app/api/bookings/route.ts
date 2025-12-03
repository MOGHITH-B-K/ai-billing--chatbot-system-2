import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, like, or, and, desc, gte, lte, inArray, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single booking fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const booking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (booking.length === 0) {
        return NextResponse.json({ 
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(booking[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const billType = searchParams.get('billType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(bookings);
    const conditions = [];

    // Search by customer name or phone
    if (search) {
      conditions.push(
        or(
          like(bookings.customerName, `%${search}%`),
          like(bookings.customerPhone, `%${search}%`)
        )
      );
    }

    // Filter by billType
    if (billType) {
      if (billType !== 'sales' && billType !== 'rental') {
        return NextResponse.json({ 
          error: "billType must be 'sales' or 'rental'",
          code: "INVALID_BILL_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(bookings.billType, billType));
    }

    // Filter by status
    if (status) {
      if (status !== 'booked' && status !== 'completed' && status !== 'cancelled') {
        return NextResponse.json({ 
          error: "status must be 'booked', 'completed', or 'cancelled'",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(bookings.status, status));
    }

    // Date range filtering on bookingDate
    if (startDate) {
      conditions.push(gte(bookings.bookingDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(bookings.bookingDate, endDate));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(bookings.bookingDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billType, billId, customerName, customerPhone, customerAddress, items, totalAmount, bookingDate, notes, status } = body;

    // Validate required fields
    if (!billType) {
      return NextResponse.json({ 
        error: 'billType is required',
        code: 'MISSING_BILL_TYPE' 
      }, { status: 400 });
    }

    if (billId === undefined || billId === null) {
      return NextResponse.json({ 
        error: 'billId is required',
        code: 'MISSING_BILL_ID' 
      }, { status: 400 });
    }

    if (!customerName) {
      return NextResponse.json({ 
        error: 'customerName is required',
        code: 'MISSING_CUSTOMER_NAME' 
      }, { status: 400 });
    }

    if (!customerPhone) {
      return NextResponse.json({ 
        error: 'customerPhone is required',
        code: 'MISSING_CUSTOMER_PHONE' 
      }, { status: 400 });
    }

    if (!items) {
      return NextResponse.json({ 
        error: 'items is required',
        code: 'MISSING_ITEMS' 
      }, { status: 400 });
    }

    if (totalAmount === undefined || totalAmount === null) {
      return NextResponse.json({ 
        error: 'totalAmount is required',
        code: 'MISSING_TOTAL_AMOUNT' 
      }, { status: 400 });
    }

    if (!bookingDate) {
      return NextResponse.json({ 
        error: 'bookingDate is required',
        code: 'MISSING_BOOKING_DATE' 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'status is required',
        code: 'MISSING_STATUS' 
      }, { status: 400 });
    }

    // Validate billType
    if (billType !== 'sales' && billType !== 'rental') {
      return NextResponse.json({ 
        error: "billType must be 'sales' or 'rental'",
        code: 'INVALID_BILL_TYPE' 
      }, { status: 400 });
    }

    // Validate status
    if (status !== 'booked' && status !== 'completed' && status !== 'cancelled') {
      return NextResponse.json({ 
        error: "status must be 'booked', 'completed', or 'cancelled'",
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate items is a valid JSON array
    if (!Array.isArray(items)) {
      return NextResponse.json({ 
        error: "items must be a valid JSON array",
        code: 'INVALID_ITEMS_FORMAT' 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      billType: billType.trim(),
      billId: billId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress ? customerAddress.trim() : null,
      items: items,
      totalAmount: totalAmount,
      bookingDate: bookingDate.trim(),
      notes: notes ? notes.trim() : null,
      status: status.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newBooking = await db.insert(bookings)
      .values(insertData)
      .returning();

    return NextResponse.json(newBooking[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if booking exists
    const existingBooking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();

    // Validate billType if provided
    if (body.billType && body.billType !== 'sales' && body.billType !== 'rental') {
      return NextResponse.json({ 
        error: "billType must be 'sales' or 'rental'",
        code: 'INVALID_BILL_TYPE' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (body.status && body.status !== 'booked' && body.status !== 'completed' && body.status !== 'cancelled') {
      return NextResponse.json({ 
        error: "status must be 'booked', 'completed', or 'cancelled'",
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate items if provided
    if (body.items && !Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "items must be a valid JSON array",
        code: 'INVALID_ITEMS_FORMAT' 
      }, { status: 400 });
    }

    // Prepare update data - ONLY include fields that are provided
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (body.billType !== undefined) updateData.billType = body.billType.trim();
    if (body.billId !== undefined) updateData.billId = body.billId;
    if (body.customerName !== undefined) updateData.customerName = body.customerName.trim();
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone.trim();
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress ? body.customerAddress.trim() : null;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.bookingDate !== undefined) updateData.bookingDate = body.bookingDate.trim();
    if (body.notes !== undefined) updateData.notes = body.notes ? body.notes.trim() : null;
    if (body.status !== undefined) updateData.status = body.status.trim();

    const updatedBooking = await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedBooking[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const bulkDelete = searchParams.get('bulkDelete') === 'true';

    // Single delete by ID
    if (id && !bulkDelete) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      // Check if booking exists
      const existingBooking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (existingBooking.length === 0) {
        return NextResponse.json({ 
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND' 
        }, { status: 404 });
      }

      await db.delete(bookings)
        .where(eq(bookings.id, parseInt(id)));

      return NextResponse.json({ 
        message: 'Booking deleted successfully'
      }, { status: 200 });
    }

    // Bulk delete
    if (bulkDelete) {
      const idsParam = searchParams.get('ids');
      
      // Delete specific bookings by IDs
      if (idsParam) {
        let bookingIds: number[] = [];

        // Try to parse as JSON array first
        try {
          const parsed = JSON.parse(idsParam);
          if (Array.isArray(parsed)) {
            bookingIds = parsed.map(id => parseInt(id)).filter(id => !isNaN(id));
          }
        } catch {
          // Parse as comma-separated string
          bookingIds = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        if (bookingIds.length === 0) {
          return NextResponse.json({ 
            error: 'No valid booking IDs provided',
            code: 'INVALID_IDS' 
          }, { status: 400 });
        }

        await db.delete(bookings)
          .where(inArray(bookings.id, bookingIds));

        return NextResponse.json({ 
          message: `${bookingIds.length} booking(s) deleted successfully`,
          deletedCount: bookingIds.length
        }, { status: 200 });
      }

      // Delete all bookings matching filters
      const billType = searchParams.get('billType');
      const status = searchParams.get('status');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const conditions = [];

      if (billType) {
        if (billType !== 'sales' && billType !== 'rental') {
          return NextResponse.json({ 
            error: "billType must be 'sales' or 'rental'",
            code: 'INVALID_BILL_TYPE' 
          }, { status: 400 });
        }
        conditions.push(eq(bookings.billType, billType));
      }

      if (status) {
        if (status !== 'booked' && status !== 'completed' && status !== 'cancelled') {
          return NextResponse.json({ 
            error: "status must be 'booked', 'completed', or 'cancelled'",
            code: 'INVALID_STATUS' 
          }, { status: 400 });
        }
        conditions.push(eq(bookings.status, status));
      }

      if (startDate) {
        conditions.push(gte(bookings.bookingDate, startDate));
      }

      if (endDate) {
        conditions.push(lte(bookings.bookingDate, endDate));
      }

      // Count records before deletion
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(bookings);
      if (conditions.length > 0) {
        countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
      }
      const countResult = await countQuery;
      const deleteCount = countResult[0]?.count || 0;

      // Perform deletion
      if (conditions.length > 0) {
        await db.delete(bookings).where(conditions.length === 1 ? conditions[0] : and(...conditions));
      } else {
        // Delete all bookings if no filters
        await db.delete(bookings);
      }

      return NextResponse.json({ 
        message: `${deleteCount} booking(s) deleted successfully`,
        deletedCount: deleteCount
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Either id or bulkDelete parameter is required',
      code: 'MISSING_PARAMETERS' 
    }, { status: 400 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}