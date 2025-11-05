import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow all requests - auth is handled by localStorage on client side
  return NextResponse.next();
}

export const config = {
  matcher: ["/sales-billing", "/rental-billing", "/previous-records", "/downloads", "/calendar", "/pending", "/advance", "/fully-paid", "/overall-sales", "/product-details", "/customer-behavior", "/chatbot"],
};