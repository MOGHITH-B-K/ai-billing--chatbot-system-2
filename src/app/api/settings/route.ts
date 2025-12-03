import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get settings from localStorage simulation (in real app, use database)
    // For now, return default settings that can be overridden by client
    const defaultSettings = {
      shopName: 'SREE SAI DURGA',
      shopAddress: 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203',
      phoneNumber1: '9790548669',
      phoneNumber2: '9442378669',
      logoUrl: '',
      paymentQrUrl: ''
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('GET settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real app, save to database
    // For now, just return the settings back
    return NextResponse.json(body);
  } catch (error) {
    console.error('POST settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
