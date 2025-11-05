import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salesBills, products } from '@/db/schema';
import { eq, like, or, and, desc, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const bill = await db.select()
        .from(salesBills)
        .where(eq(salesBills.id, parseInt(id)))
        .limit(1);

      if (bill.length === 0) {
        return NextResponse.json({ error: 'Sales bill not found' }, { status: 404 });
      }

      return NextResponse.json(bill[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isPaidParam = searchParams.get('isPaid');

    let query = db.select().from(salesBills);
    const conditions = [];

    // Date range filter
    if (startDate) {
      conditions.push(gte(salesBills.billDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(salesBills.billDate, endDate));
    }

    // Payment status filter
    if (isPaidParam !== null) {
      const isPaidValue = isPaidParam === 'true';
      conditions.push(eq(salesBills.isPaid, isPaidValue));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(salesBills.customerName, `%${search}%`),
          like(salesBills.customerPhone, `%${search}%`)
        )
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by billDate descending and apply pagination
    const results = await query
      .orderBy(desc(salesBills.billDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'billDate', 'customerName', 'customerPhone', 'items', 
      'subtotal', 'taxPercentage', 'taxAmount', 'taxType', 
      'advanceAmount', 'totalAmount', 'isPaid'
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json({ 
          error: `${field} is required`,
          code: "MISSING_REQUIRED_FIELD" 
        }, { status: 400 });
      }
    }

    // Validate items is a valid array
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "items must be a valid JSON array",
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

    // Get next serial number
    const maxSerialResult = await db.select({ 
      maxSerial: sql<number>`MAX(${salesBills.serialNo})` 
    }).from(salesBills);
    
    const nextSerialNo = (maxSerialResult[0]?.maxSerial ?? 0) + 1;

    // Reduce stock for each item sold
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
          
          // Update stock quantity and increment totalSales
          await db.update(products)
            .set({ 
              stockQuantity: Math.max(0, newStockQty),
              totalSales: (product.totalSales || 0) + (item.qty || 0)
            })
            .where(eq(products.id, product.id));
        }
      } catch (error) {
        console.error(`Error updating stock for ${item.itemName}:`, error);
        // Continue with other items even if one fails
      }
    }

    // Prepare insert data with shop details
    const insertData = {
      serialNo: nextSerialNo,
      billDate: body.billDate.trim(),
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerAddress: body.customerAddress?.trim() || null,
      items: body.items,
      subtotal: body.subtotal,
      taxPercentage: body.taxPercentage,
      taxAmount: body.taxAmount,
      taxType: body.taxType.trim(),
      advanceAmount: body.advanceAmount,
      totalAmount: body.totalAmount,
      isPaid: body.isPaid,
      customerFeedback: body.customerFeedback?.trim() || null,
      shopName: body.shopName?.trim() || 'SREE SAI DURGA',
      shopAddress: body.shopAddress?.trim() || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203',
      shopPhone1: body.shopPhone1?.trim() || '9790548669',
      shopPhone2: body.shopPhone2?.trim() || '9442378669',
      shopLogoUrl: body.shopLogoUrl?.trim() || null,
      shopQrUrl: body.shopQrUrl?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newBill = await db.insert(salesBills)
      .values(insertData)
      .returning();

    return NextResponse.json(newBill[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    // Check if record exists
    const existing = await db.select()
      .from(salesBills)
      .where(eq(salesBills.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sales bill not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate items if provided
    if (body.items !== undefined && !Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "items must be a valid JSON array",
        code: "INVALID_ITEMS_FORMAT" 
      }, { status: 400 });
    }

    // Validate isPaid if provided
    if (body.isPaid !== undefined && typeof body.isPaid !== 'boolean') {
      return NextResponse.json({ 
        error: "isPaid must be a boolean value",
        code: "INVALID_ISPAID_TYPE" 
      }, { status: 400 });
    }

    // Prepare update data - DO NOT include items in the update object if it's an array
    // Drizzle will handle JSON serialization automatically for json mode columns
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Add fields to update if provided
    if (body.billDate) updateData.billDate = body.billDate.trim();
    if (body.customerName) updateData.customerName = body.customerName.trim();
    if (body.customerPhone) updateData.customerPhone = body.customerPhone.trim();
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress?.trim() || null;
    // Items should be passed as-is (array), Drizzle handles JSON serialization
    if (body.items !== undefined) updateData.items = body.items;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.taxPercentage !== undefined) updateData.taxPercentage = body.taxPercentage;
    if (body.taxAmount !== undefined) updateData.taxAmount = body.taxAmount;
    if (body.taxType) updateData.taxType = body.taxType.trim();
    if (body.advanceAmount !== undefined) updateData.advanceAmount = body.advanceAmount;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.isPaid !== undefined) updateData.isPaid = body.isPaid;
    if (body.customerFeedback !== undefined) updateData.customerFeedback = body.customerFeedback?.trim() || null;

    const updated = await db.update(salesBills)
      .set(updateData)
      .where(eq(salesBills.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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
    const existing = await db.select()
      .from(salesBills)
      .where(eq(salesBills.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sales bill not found' }, { status: 404 });
    }

    const deleted = await db.delete(salesBills)
      .where(eq(salesBills.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Sales bill deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}