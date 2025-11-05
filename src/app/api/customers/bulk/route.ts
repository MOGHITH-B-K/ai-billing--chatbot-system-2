import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, startDate, endDate } = body;

    if (action === 'deleteAll') {
      // Delete all customers or filtered by date
      let deleteQuery = db.delete(customers);

      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(gte(customers.createdAt, startDate));
        }
        if (endDate) {
          conditions.push(lte(customers.createdAt, endDate));
        }
        if (conditions.length > 0) {
          deleteQuery = deleteQuery.where(and(...conditions));
        }
      }

      await deleteQuery;

      return NextResponse.json({ 
        success: true, 
        message: 'Customers deleted successfully' 
      }, { status: 200 });
    }

    if (action === 'upload') {
      // Bulk upload customers
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json(
          { error: 'Invalid data format. Expected array of customers.', code: 'INVALID_DATA' },
          { status: 400 }
        );
      }

      const timestamp = new Date().toISOString();
      const customersToInsert = [];

      for (const customer of data) {
        if (!customer.name || !customer.phone) {
          continue; // Skip invalid entries
        }

        customersToInsert.push({
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: customer.address ? customer.address.trim() : null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }

      if (customersToInsert.length === 0) {
        return NextResponse.json(
          { error: 'No valid customers to upload', code: 'NO_VALID_DATA' },
          { status: 400 }
        );
      }

      // Insert customers
      const inserted = await db.insert(customers)
        .values(customersToInsert)
        .returning();

      return NextResponse.json({ 
        success: true, 
        count: inserted.length,
        message: `${inserted.length} customers uploaded successfully` 
      }, { status: 201 });
    }

    if (action === 'export') {
      // Export all customers or filtered by date
      let query = db.select().from(customers);

      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(gte(customers.createdAt, startDate));
        }
        if (endDate) {
          conditions.push(lte(customers.createdAt, endDate));
        }
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }

      const results = await query;

      return NextResponse.json({ 
        success: true, 
        data: results,
        count: results.length 
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid action', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
