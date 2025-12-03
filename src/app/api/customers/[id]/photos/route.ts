import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate customer ID
    const customerId = parseInt(id);
    if (!id || isNaN(customerId)) {
      return NextResponse.json(
        {
          error: 'Valid customer ID is required',
          code: 'INVALID_CUSTOMER_ID',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { photos } = body;

    // Validate photos is an array
    if (!Array.isArray(photos)) {
      return NextResponse.json(
        {
          error: 'Photos must be an array',
          code: 'INVALID_PHOTOS_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate each photo is a non-empty string
    for (let i = 0; i < photos.length; i++) {
      if (typeof photos[i] !== 'string' || photos[i].trim() === '') {
        return NextResponse.json(
          {
            error: `Photo at index ${i} must be a non-empty string`,
            code: 'INVALID_PHOTO_STRING',
          },
          { status: 400 }
        );
      }
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        {
          error: 'Customer not found',
          code: 'CUSTOMER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get existing photoUrls (may be null or existing array)
    const currentPhotoUrls = existingCustomer[0].photoUrls as string[] | null;
    const existingPhotos = currentPhotoUrls || [];

    // Append new photos to existing array
    const updatedPhotoUrls = [...existingPhotos, ...photos];

    // Update customer with new photoUrls
    const updatedCustomer = await db
      .update(customers)
      .set({
        photoUrls: updatedPhotoUrls,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json(updatedCustomer[0], { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate customer ID
    const customerId = parseInt(id);
    if (!id || isNaN(customerId)) {
      return NextResponse.json(
        {
          error: 'Valid customer ID is required',
          code: 'INVALID_CUSTOMER_ID',
        },
        { status: 400 }
      );
    }

    // Get photoIndex from query parameters
    const searchParams = request.nextUrl.searchParams;
    const photoIndexParam = searchParams.get('photoIndex');

    if (!photoIndexParam) {
      return NextResponse.json(
        {
          error: 'Photo index is required',
          code: 'MISSING_PHOTO_INDEX',
        },
        { status: 400 }
      );
    }

    // Validate photoIndex is a valid integer
    const photoIndex = parseInt(photoIndexParam);
    if (isNaN(photoIndex)) {
      return NextResponse.json(
        {
          error: 'Photo index must be a valid integer',
          code: 'INVALID_PHOTO_INDEX',
        },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        {
          error: 'Customer not found',
          code: 'CUSTOMER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get existing photoUrls
    let currentPhotoUrls = existingCustomer[0].photoUrls;
    
    // Parse JSON string if needed
    if (typeof currentPhotoUrls === 'string') {
      try {
        currentPhotoUrls = JSON.parse(currentPhotoUrls);
      } catch (e) {
        currentPhotoUrls = null;
      }
    }

    // Check if photoUrls exists and is array
    if (!currentPhotoUrls || !Array.isArray(currentPhotoUrls) || currentPhotoUrls.length === 0) {
      return NextResponse.json(
        {
          error: 'No photos exist for this customer',
          code: 'NO_PHOTOS_EXIST',
        },
        { status: 400 }
      );
    }

    // Validate photoIndex is within array bounds
    if (photoIndex < 0 || photoIndex >= currentPhotoUrls.length) {
      return NextResponse.json(
        {
          error: `Photo index out of bounds. Valid range: 0-${currentPhotoUrls.length - 1}`,
          code: 'PHOTO_INDEX_OUT_OF_BOUNDS',
        },
        { status: 400 }
      );
    }

    // Remove photo at specified index
    const updatedPhotoUrls = currentPhotoUrls.filter((_, index) => index !== photoIndex);

    // Update customer with modified photoUrls
    await db
      .update(customers)
      .set({
        photoUrls: updatedPhotoUrls,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json(
      {
        message: 'Photo removed successfully',
        photoUrls: updatedPhotoUrls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}