import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salesBills } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const result = await db.select({ 
      maxSerial: sql<number>`MAX(${salesBills.serialNo})` 
    }).from(salesBills);

    const maxSerial = result[0]?.maxSerial;
    const nextSerial = maxSerial ? maxSerial + 1 : 1;

    return NextResponse.json({ nextSerial });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}