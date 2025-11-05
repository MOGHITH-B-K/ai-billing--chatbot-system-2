import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockHistory, products } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdParam = searchParams.get('productId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate productId if provided
    let productId: number | null = null;
    if (productIdParam) {
      productId = parseInt(productIdParam);
      if (isNaN(productId)) {
        return NextResponse.json({ 
          error: 'Invalid productId parameter. Must be a valid integer.',
          code: 'INVALID_PRODUCT_ID'
        }, { status: 400 });
      }
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(limitParam ?? '50'), 200);
    const offset = parseInt(offsetParam ?? '0');

    // Build query with join to products table
    let query = db
      .select({
        id: stockHistory.id,
        productId: stockHistory.productId,
        productName: products.name,
        changeType: stockHistory.changeType,
        quantityChange: stockHistory.quantityChange,
        previousQuantity: stockHistory.previousQuantity,
        newQuantity: stockHistory.newQuantity,
        notes: stockHistory.notes,
        createdAt: stockHistory.createdAt,
      })
      .from(stockHistory)
      .innerJoin(products, eq(stockHistory.productId, products.id))
      .orderBy(desc(stockHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply productId filter if provided
    if (productId !== null) {
      query = query.where(eq(stockHistory.productId, productId));
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET stock history error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}