import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single product fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const product = await db.select({
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
        .where(eq(products.id, parseInt(id)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ 
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(product[0]);
    }

    // List products with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const productType = searchParams.get('productType');
    const category = searchParams.get('category');

    let query = db.select({
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
    }).from(products);
    const conditions = [];

    // Filter by productType
    if (productType) {
      if (productType !== 'sales' && productType !== 'rental') {
        return NextResponse.json({ 
          error: "Product type must be 'sales' or 'rental'",
          code: "INVALID_PRODUCT_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(products.productType, productType));
    }

    // Filter by category
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Search by product name
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

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
    const { name, rate, productType, category } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: "Product name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (rate === undefined || rate === null) {
      return NextResponse.json({ 
        error: "Product rate is required",
        code: "MISSING_RATE" 
      }, { status: 400 });
    }

    if (typeof rate !== 'number' || rate < 0) {
      return NextResponse.json({ 
        error: "Rate must be a positive number",
        code: "INVALID_RATE" 
      }, { status: 400 });
    }

    if (!productType) {
      return NextResponse.json({ 
        error: "Product type is required",
        code: "MISSING_PRODUCT_TYPE" 
      }, { status: 400 });
    }

    // Validate productType
    if (productType !== 'sales' && productType !== 'rental') {
      return NextResponse.json({ 
        error: "Product type must be 'sales' or 'rental'",
        code: "INVALID_PRODUCT_TYPE" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedCategory = category ? category.trim() : null;

    // Create new product
    const newProduct = await db.insert(products)
      .values({
        name: sanitizedName,
        rate: rate,
        productType: productType,
        category: sanitizedCategory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, rate, productType, category } = body;

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate fields if provided
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ 
        error: "Product name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
      return NextResponse.json({ 
        error: "Rate must be a positive number",
        code: "INVALID_RATE" 
      }, { status: 400 });
    }

    if (productType !== undefined && productType !== 'sales' && productType !== 'rental') {
      return NextResponse.json({ 
        error: "Product type must be 'sales' or 'rental'",
        code: "INVALID_PRODUCT_TYPE" 
      }, { status: 400 });
    }

    // Prepare update object
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name.trim();
    if (rate !== undefined) updates.rate = rate;
    if (productType !== undefined) updates.productType = productType;
    if (category !== undefined) updates.category = category ? category.trim() : null;

    // Update product
    const updatedProduct = await db.update(products)
      .set(updates)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProduct[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const bulkDelete = searchParams.get('bulkDelete');

    // Bulk delete all products
    if (bulkDelete === 'true') {
      const deletedProducts = await db.delete(products).returning();
      
      return NextResponse.json({
        message: `Successfully deleted ${deletedProducts.length} product(s)`,
        count: deletedProducts.length
      });
    }

    // Single product delete
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete product
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: deletedProduct[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}