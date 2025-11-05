import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, desc, lt, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 1. Total products count
    const totalProductsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    const totalProducts = Number(totalProductsResult[0]?.count || 0);

    // 2. Total sales products count
    const salesProductsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.productType, 'sales'));
    const salesProducts = Number(salesProductsResult[0]?.count || 0);

    // 3. Total rental products count
    const rentalProductsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.productType, 'rental'));
    const rentalProducts = Number(rentalProductsResult[0]?.count || 0);

    // 4. Sum of all totalSales
    const totalSalesResult = await db
      .select({ sum: sql<number>`COALESCE(sum(${products.totalSales}), 0)` })
      .from(products);
    const totalSalesCount = Number(totalSalesResult[0]?.sum || 0);

    // 5. Sum of all totalRentals
    const totalRentalsResult = await db
      .select({ sum: sql<number>`COALESCE(sum(${products.totalRentals}), 0)` })
      .from(products);
    const totalRentalsCount = Number(totalRentalsResult[0]?.sum || 0);

    // 6. Top 10 selling products
    const topSellingProducts = await db
      .select({
        id: products.id,
        name: products.name,
        rate: products.rate,
        category: products.category,
        productType: products.productType,
        totalSales: products.totalSales,
        stockQuantity: products.stockQuantity,
      })
      .from(products)
      .orderBy(desc(products.totalSales))
      .limit(10);

    // 7. Top 10 rented products
    const topRentedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        rate: products.rate,
        category: products.category,
        productType: products.productType,
        totalRentals: products.totalRentals,
        stockQuantity: products.stockQuantity,
      })
      .from(products)
      .orderBy(desc(products.totalRentals))
      .limit(10);

    // 8. Low stock count (stockQuantity < minStockLevel)
    const lowStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} < ${products.minStockLevel}`);
    const lowStockCount = Number(lowStockResult[0]?.count || 0);

    // 9. Out of stock count (stockQuantity = 0)
    const outOfStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.stockQuantity, 0));
    const outOfStockCount = Number(outOfStockResult[0]?.count || 0);

    return NextResponse.json({
      totalProducts,
      salesProducts,
      rentalProducts,
      totalSalesCount,
      totalRentalsCount,
      topSellingProducts,
      topRentedProducts,
      lowStockCount,
      outOfStockCount,
    }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}