import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesBills, rentalBills, products, customers, calendarBookings } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get counts for all tables
    const [salesCount] = await db.select({ count: sql<number>`count(*)` }).from(salesBills);
    const [rentalCount] = await db.select({ count: sql<number>`count(*)` }).from(rentalBills);
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const [bookingCount] = await db.select({ count: sql<number>`count(*)` }).from(calendarBookings);

    // Calculate estimated storage (approximate)
    const avgBillSize = 2; // KB per bill (approximate)
    const avgProductSize = 0.5; // KB per product
    const avgCustomerSize = 0.3; // KB per customer
    const avgBookingSize = 0.5; // KB per booking

    const salesBillsSize = (salesCount.count || 0) * avgBillSize;
    const rentalBillsSize = (rentalCount.count || 0) * avgBillSize;
    const productsSize = (productCount.count || 0) * avgProductSize;
    const customersSize = (customerCount.count || 0) * avgCustomerSize;
    const bookingsSize = (bookingCount.count || 0) * avgBookingSize;

    const totalSizeKB = salesBillsSize + rentalBillsSize + productsSize + customersSize + bookingsSize;
    const totalSizeMB = totalSizeKB / 1024;
    const totalSizeGB = totalSizeMB / 1024;

    const maxStorageGB = 10; // 10 GB limit
    const usedPercentage = (totalSizeGB / maxStorageGB) * 100;

    return NextResponse.json({
      records: {
        salesBills: salesCount.count || 0,
        rentalBills: rentalCount.count || 0,
        products: productCount.count || 0,
        customers: customerCount.count || 0,
        bookings: bookingCount.count || 0,
        total: (salesCount.count || 0) + (rentalCount.count || 0) + (productCount.count || 0) + (customerCount.count || 0) + (bookingCount.count || 0)
      },
      storage: {
        usedKB: Math.round(totalSizeKB * 100) / 100,
        usedMB: Math.round(totalSizeMB * 100) / 100,
        usedGB: Math.round(totalSizeGB * 1000) / 1000,
        maxGB: maxStorageGB,
        availableGB: Math.round((maxStorageGB - totalSizeGB) * 1000) / 1000,
        usedPercentage: Math.round(usedPercentage * 100) / 100
      },
      breakdown: {
        salesBills: { count: salesCount.count || 0, sizeKB: Math.round(salesBillsSize * 100) / 100 },
        rentalBills: { count: rentalCount.count || 0, sizeKB: Math.round(rentalBillsSize * 100) / 100 },
        products: { count: productCount.count || 0, sizeKB: Math.round(productsSize * 100) / 100 },
        customers: { count: customerCount.count || 0, sizeKB: Math.round(customersSize * 100) / 100 },
        bookings: { count: bookingCount.count || 0, sizeKB: Math.round(bookingsSize * 100) / 100 }
      }
    });
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch storage data',
      message: (error as Error).message 
    }, { status: 500 });
  }
}
