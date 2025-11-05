import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salesBills, rentalBills, products, customers } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get counts for all tables
    const [salesCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(salesBills);
    const [rentalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(rentalBills);
    const [productsCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(products);
    const [customersCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(customers);

    // Estimate storage size (rough calculation)
    // Each bill record averages ~2KB, products ~0.5KB, customers ~0.3KB
    const salesBillsSize = (salesCount?.count || 0) * 2; // KB
    const rentalBillsSize = (rentalCount?.count || 0) * 2; // KB
    const productsSize = (productsCount?.count || 0) * 0.5; // KB
    const customersSize = (customersCount?.count || 0) * 0.3; // KB
    
    const totalSizeKB = salesBillsSize + rentalBillsSize + productsSize + customersSize;
    const totalSizeMB = totalSizeKB / 1024;
    const totalSizeGB = totalSizeMB / 1024;

    // Calculate percentage of 10GB limit
    const storageLimit = 10; // GB
    const usagePercentage = (totalSizeGB / storageLimit) * 100;

    return NextResponse.json({
      records: {
        salesBills: salesCount?.count || 0,
        rentalBills: rentalCount?.count || 0,
        products: productsCount?.count || 0,
        customers: customersCount?.count || 0,
        total: (salesCount?.count || 0) + (rentalCount?.count || 0) + (productsCount?.count || 0) + (customersCount?.count || 0)
      },
      storage: {
        used: {
          bytes: totalSizeKB * 1024,
          kb: Math.round(totalSizeKB * 100) / 100,
          mb: Math.round(totalSizeMB * 100) / 100,
          gb: Math.round(totalSizeGB * 1000) / 1000
        },
        limit: {
          gb: storageLimit
        },
        percentage: Math.round(usagePercentage * 100) / 100,
        remaining: {
          gb: Math.round((storageLimit - totalSizeGB) * 1000) / 1000
        }
      },
      breakdown: {
        salesBills: {
          count: salesCount?.count || 0,
          sizeKB: Math.round(salesBillsSize * 100) / 100,
          sizeMB: Math.round((salesBillsSize / 1024) * 100) / 100
        },
        rentalBills: {
          count: rentalCount?.count || 0,
          sizeKB: Math.round(rentalBillsSize * 100) / 100,
          sizeMB: Math.round((rentalBillsSize / 1024) * 100) / 100
        },
        products: {
          count: productsCount?.count || 0,
          sizeKB: Math.round(productsSize * 100) / 100,
          sizeMB: Math.round((productsSize / 1024) * 100) / 100
        },
        customers: {
          count: customersCount?.count || 0,
          sizeKB: Math.round(customersSize * 100) / 100,
          sizeMB: Math.round((customersSize / 1024) * 100) / 100
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Storage stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch storage statistics: ' + (error as Error).message 
    }, { status: 500 });
  }
}
