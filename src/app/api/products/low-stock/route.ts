import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { sql, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query products where stockQuantity < minStockLevel using SQL expression
    const lowStockProducts = await db.select({
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
      .where(sql`${products.stockQuantity} < ${products.minStockLevel}`)
      .orderBy(asc(products.stockQuantity));

    // Add calculated stockDeficit field to each product
    const productsWithDeficit = lowStockProducts.map(product => ({
      ...product,
      stockDeficit: product.minStockLevel - product.stockQuantity
    }));

    return NextResponse.json(productsWithDeficit, { status: 200 });

  } catch (error) {
    console.error('GET low stock products error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}