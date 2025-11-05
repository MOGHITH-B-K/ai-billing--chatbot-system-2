import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rentalBills, products } from '@/db/schema';
import { eq, like, or, and, desc, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(rentalBills)
        .where(eq(rentalBills.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Rental bill not found' }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, filtering and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isPaidParam = searchParams.get('isPaid');

    let query = db.select().from(rentalBills);
    const conditions = [];

    // Search by customer name or phone
    if (search) {
      conditions.push(
        or(
          like(rentalBills.customerName, `%${search}%`),
          like(rentalBills.customerPhone, `%${search}%`)
        )
      );
    }

    // Date range filtering on fromDate
    if (startDate) {
      conditions.push(gte(rentalBills.fromDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(rentalBills.fromDate, endDate));
    }

    // Payment status filter
    if (isPaidParam !== null) {
      const isPaid = isPaidParam === 'true';
      conditions.push(eq(rentalBills.isPaid, isPaid));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(rentalBills.fromDate))
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

    // Validate required fields
    const requiredFields = [
      'fromDate', 'customerName', 'customerPhone', 'items', 
      'subtotal', 'transportFees', 'taxPercentage', 'taxAmount', 
      'taxType', 'advanceAmount', 'totalAmount', 'isPaid'
    ];

    for (const field of requiredFields) {
      if (!(field in body) || body[field] === null || body[field] === undefined) {
        return NextResponse.json({ 
          error: `Required field '${field}' is missing`,
          code: "MISSING_REQUIRED_FIELD" 
        }, { status: 400 });
      }
    }

    // Validate items is a valid JSON array
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "Items must be a valid JSON array",
        code: "INVALID_ITEMS_FORMAT" 
      }, { status: 400 });
    }

    // Validate isPaid is boolean
    if (typeof body.isPaid !== 'boolean') {
      return NextResponse.json({ 
        error: "isPaid must be a boolean value",
        code: "INVALID_ISPAID_TYPE" 
      }, { status: 400 });
    }

    // Get the maximum serial_no and increment by 1
    const maxSerialResult = await db.select({ 
      maxSerial: sql<number>`MAX(${rentalBills.serialNo})` 
    }).from(rentalBills);
    
    const nextSerialNo = (maxSerialResult[0]?.maxSerial ?? 0) + 1;

    // Reduce stock for each item rented
    for (const item of body.items) {
      try {
        // Find product by name
        const productRecords = await db.select()
          .from(products)
          .where(eq(products.name, item.itemName))
          .limit(1);
        
        if (productRecords.length > 0) {
          const product = productRecords[0];
          const newStockQty = (product.stockQuantity || 0) - (item.qty || 0);
          
          // Update stock quantity and increment totalRentals
          await db.update(products)
            .set({ 
              stockQuantity: Math.max(0, newStockQty),
              totalRentals: (product.totalRentals || 0) + (item.qty || 0)
            })
            .where(eq(products.id, product.id));
        }
      } catch (error) {
        console.error(`Error updating stock for ${item.itemName}:`, error);
        // Continue with other items even if one fails
      }
    }

    // Sanitize inputs and include shop details
    const sanitizedData = {
      serialNo: nextSerialNo,
      fromDate: body.fromDate.trim(),
      toDate: body.toDate ? body.toDate.trim() : null,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerAddress: body.customerAddress ? body.customerAddress.trim() : null,
      items: body.items,
      subtotal: body.subtotal,
      transportFees: body.transportFees,
      taxPercentage: body.taxPercentage,
      taxAmount: body.taxAmount,
      taxType: body.taxType.trim(),
      advanceAmount: body.advanceAmount,
      totalAmount: body.totalAmount,
      isPaid: body.isPaid,
      customerFeedback: body.customerFeedback ? body.customerFeedback.trim() : null,
      shopName: body.shopName?.trim() || 'SREE SAI DURGA',
      shopAddress: body.shopAddress?.trim() || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203',
      shopPhone1: body.shopPhone1?.trim() || '9790548669',
      shopPhone2: body.shopPhone2?.trim() || '9442378669',
      shopLogoUrl: body.shopLogoUrl?.trim() || null,
      shopQrUrl: body.shopQrUrl?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newBill = await db.insert(rentalBills)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newBill[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    // Check if record exists
    const existingRecord = await db.select()
      .from(rentalBills)
      .where(eq(rentalBills.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Rental bill not found' }, { status: 404 });
    }

    // Validate items if provided
    if ('items' in body && !Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "Items must be a valid JSON array",
        code: "INVALID_ITEMS_FORMAT" 
      }, { status: 400 });
    }

    // Validate isPaid if provided
    if ('isPaid' in body && typeof body.isPaid !== 'boolean') {
      return NextResponse.json({ 
        error: "isPaid must be a boolean value",
        code: "INVALID_ISPAID_TYPE" 
      }, { status: 400 });
    }

    // Prepare update data with sanitization
    // Drizzle handles JSON serialization automatically for json mode columns
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if ('fromDate' in body) updates.fromDate = body.fromDate.trim();
    if ('toDate' in body) updates.toDate = body.toDate ? body.toDate.trim() : null;
    if ('customerName' in body) updates.customerName = body.customerName.trim();
    if ('customerPhone' in body) updates.customerPhone = body.customerPhone.trim();
    if ('customerAddress' in body) updates.customerAddress = body.customerAddress ? body.customerAddress.trim() : null;
    // Items should be passed as-is (array), Drizzle handles JSON serialization
    if ('items' in body) updates.items = body.items;
    if ('subtotal' in body) updates.subtotal = body.subtotal;
    if ('transportFees' in body) updates.transportFees = body.transportFees;
    if ('taxPercentage' in body) updates.taxPercentage = body.taxPercentage;
    if ('taxAmount' in body) updates.taxAmount = body.taxAmount;
    if ('taxType' in body) updates.taxType = body.taxType.trim();
    if ('advanceAmount' in body) updates.advanceAmount = body.advanceAmount;
    if ('totalAmount' in body) updates.totalAmount = body.totalAmount;
    if ('isPaid' in body) updates.isPaid = body.isPaid;
    if ('customerFeedback' in body) updates.customerFeedback = body.customerFeedback ? body.customerFeedback.trim() : null;

    const updated = await db.update(rentalBills)
      .set(updates)
      .where(eq(rentalBills.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(rentalBills)
      .where(eq(rentalBills.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Rental bill not found' }, { status: 404 });
    }

    const deleted = await db.delete(rentalBills)
      .where(eq(rentalBills.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Rental bill deleted successfully',
      record: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}