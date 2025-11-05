import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stockHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { productId, quantityToAdd, notes } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required', code: 'MISSING_PRODUCT_ID' },
        { status: 400 }
      );
    }

    if (!quantityToAdd) {
      return NextResponse.json(
        { error: 'Quantity to add is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    // Validate productId is a valid integer
    const parsedProductId = parseInt(productId);
    if (isNaN(parsedProductId)) {
      return NextResponse.json(
        { error: 'Product ID must be a valid integer', code: 'INVALID_PRODUCT_ID' },
        { status: 400 }
      );
    }

    // Validate quantityToAdd is a positive integer
    const parsedQuantity = parseInt(quantityToAdd);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity to add must be a positive integer', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Check if product exists and fetch current stock quantity
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, parsedProductId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentProduct = existingProduct[0];
    const previousQuantity = currentProduct.stockQuantity;
    const newQuantity = previousQuantity + parsedQuantity;
    const currentTimestamp = new Date().toISOString();

    // Update products table
    const updatedProduct = await db
      .update(products)
      .set({
        stockQuantity: newQuantity,
        lastRestocked: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .where(eq(products.id, parsedProductId))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update product stock', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Insert into stockHistory table
    await db.insert(stockHistory).values({
      productId: parsedProductId,
      changeType: 'restock',
      quantityChange: parsedQuantity,
      previousQuantity: previousQuantity,
      newQuantity: newQuantity,
      notes: notes || null,
      createdAt: currentTimestamp,
    });

    return NextResponse.json(updatedProduct[0], { status: 200 });
  } catch (error) {
    console.error('POST restock error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}