import { NextRequest, NextResponse } from "next/server";

// In-memory storage for settings (you can replace this with database storage)
let shopSettings = {
  shopName: "SREE SAI DURGA",
  shopAddress: "MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203",
  phoneNumber1: "9790548669",
  phoneNumber2: "9442378669",
  logoUrl: null as string | null,
  paymentQrUrl: null as string | null,
};

export async function GET() {
  try {
    return NextResponse.json(shopSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update settings
    shopSettings = {
      shopName: body.shopName || shopSettings.shopName,
      shopAddress: body.shopAddress || shopSettings.shopAddress,
      phoneNumber1: body.phoneNumber1 || shopSettings.phoneNumber1,
      phoneNumber2: body.phoneNumber2 || shopSettings.phoneNumber2,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : shopSettings.logoUrl,
      paymentQrUrl: body.paymentQrUrl !== undefined ? body.paymentQrUrl : shopSettings.paymentQrUrl,
    };

    return NextResponse.json(shopSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
