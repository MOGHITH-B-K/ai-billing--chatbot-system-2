import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query all products ordered by createdAt DESC
    const allProducts = await db.select({
      id: products.id,
      name: products.name,
      rate: products.rate,
      category: products.category,
      productType: products.productType,
      stockQuantity: products.stockQuantity,
      minStockLevel: products.minStockLevel,
      totalSales: products.totalSales,
      totalRentals: products.totalRentals,
      lastRestocked: products.lastRestocked,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
      .from(products)
      .orderBy(desc(products.createdAt));

    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'EXPORT_ERROR'
      },
      { status: 500 }
    );
  }
}