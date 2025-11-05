"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileDown, Trash2, CalendarIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { format, isWithinInterval, parseISO } from "date-fns";
import { generateSalesBillPDF, generateRentalBillPDF } from "@/lib/pdf-generator";

interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

interface SalesBill {
  id: number;
  serialNo: number;
  billDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: BillItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone1?: string;
  shopPhone2?: string;
  shopLogoUrl?: string;
  shopQrUrl?: string;
}

interface RentalBill {
  id: number;
  serialNo: number;
  fromDate: string;
  toDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: BillItem[];
  subtotal: number;
  transportFees: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone1?: string;
  shopPhone2?: string;
  shopLogoUrl?: string;
  shopQrUrl?: string;
}

export default function DownloadsPage() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [rentalBills, setRentalBills] = useState<RentalBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Fetch bills on mount
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const [salesRes, rentalRes] = await Promise.all([
        fetch('/api/sales-bills?limit=10000'),
        fetch('/api/rental-bills?limit=10000')
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSalesBills(salesData);
      }

      if (rentalRes.ok) {
        const rentalData = await rentalRes.json();
        setRentalBills(rentalData);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bills by date range
  const filterByDate = (bills: SalesBill[] | RentalBill[], dateField: 'billDate' | 'fromDate') => {
    if (!fromDate && !toDate) return bills;
    
    return bills.filter(bill => {
      const billDate = parseISO((bill as any)[dateField]);
      
      if (fromDate && toDate) {
        return isWithinInterval(billDate, { start: fromDate, end: toDate });
      } else if (fromDate) {
        return billDate >= fromDate;
      } else if (toDate) {
        return billDate <= toDate;
      }
      return true;
    });
  };

  const filteredSalesBills = filterByDate(salesBills, 'billDate') as SalesBill[];
  const filteredRentalBills = filterByDate(rentalBills, 'fromDate') as RentalBill[];
  const allFilteredBills = [...filteredSalesBills, ...filteredRentalBills];

  const clearDateFilter = () => {
    setFromDate(undefined);
    setToDate(undefined);
    toast.success("Date filter cleared");
  };

  const downloadBill = async (bill: SalesBill | RentalBill, type: "sales" | "rental") => {
    try {
      setDownloadingId(bill.id);
      
      // Get shop settings from localStorage
      const shopProfile = JSON.parse(localStorage.getItem("shop_profile") || "{}");
      
      // Merge shop settings with bill data
      const billWithShopInfo = {
        ...bill,
        shopName: shopProfile.name || bill.shopName || "SREE SAI DURGA",
        shopAddress: shopProfile.address || bill.shopAddress || "MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203",
        shopPhone1: shopProfile.phone1 || bill.shopPhone1 || "9790548669",
        shopPhone2: shopProfile.phone2 || bill.shopPhone2 || "9442378669",
        shopLogoUrl: shopProfile.logo || bill.shopLogoUrl || null,
        shopQrUrl: shopProfile.paymentQRCode || bill.shopQrUrl || null,
      };

      if (type === "sales") {
        await generateSalesBillPDF(billWithShopInfo as SalesBill);
      } else {
        await generateRentalBillPDF(billWithShopInfo as RentalBill);
      }
      toast.success("Bill downloaded as PDF successfully");
    } catch (error) {
      console.error('Error downloading bill:', error);
      toast.error("Failed to download bill PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAllSales = async () => {
    if (filteredSalesBills.length === 0) {
      toast.error("No sales bills to download");
      return;
    }
    
    toast.info(`Downloading ${filteredSalesBills.length} sales bills...`);
    
    let successCount = 0;
    for (const bill of filteredSalesBills) {
      try {
        await downloadBill(bill, "sales");
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading bill:', error);
      }
    }
    
    toast.success(`Downloaded ${successCount} of ${filteredSalesBills.length} sales bills as PDF`);
  };

  const downloadAllRental = async () => {
    if (filteredRentalBills.length === 0) {
      toast.error("No rental bills to download");
      return;
    }
    
    toast.info(`Downloading ${filteredRentalBills.length} rental bills...`);
    
    let successCount = 0;
    for (const bill of filteredRentalBills) {
      try {
        await downloadBill(bill, "rental");
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading bill:', error);
      }
    }
    
    toast.success(`Downloaded ${successCount} of ${filteredRentalBills.length} rental bills as PDF`);
  };

  const downloadAll = async () => {
    if (allFilteredBills.length === 0) {
      toast.error("No bills to download");
      return;
    }
    
    toast.info(`Downloading ${allFilteredBills.length} bills...`);
    
    let successCount = 0;
    for (const bill of filteredSalesBills) {
      try {
        await downloadBill(bill, "sales");
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading bill:', error);
      }
    }
    
    for (const bill of filteredRentalBills) {
      try {
        await downloadBill(bill, "rental");
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading bill:', error);
      }
    }
    
    toast.success(`Downloaded ${successCount} of ${allFilteredBills.length} bills as PDF`);
  };

  const deleteAllSales = async () => {
    if (filteredSalesBills.length === 0) {
      toast.error("No sales bills to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${filteredSalesBills.length} sales bills${fromDate || toDate ? ' in the selected date range' : ''}?`)) {
      return;
    }

    try {
      let successCount = 0;
      for (const bill of filteredSalesBills) {
        try {
          const response = await fetch(`/api/sales-bills?id=${bill.id}`, { method: 'DELETE' });
          if (response.ok) successCount++;
        } catch (error) {
          console.error('Error deleting bill:', error);
        }
      }
      toast.success(`Deleted ${successCount} of ${filteredSalesBills.length} sales bills`);
      fetchBills();
    } catch (error) {
      console.error('Error deleting bills:', error);
      toast.error("Failed to delete bills");
    }
  };

  const deleteAllRental = async () => {
    if (filteredRentalBills.length === 0) {
      toast.error("No rental bills to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${filteredRentalBills.length} rental bills${fromDate || toDate ? ' in the selected date range' : ''}?`)) {
      return;
    }

    try {
      let successCount = 0;
      for (const bill of filteredRentalBills) {
        try {
          const response = await fetch(`/api/rental-bills?id=${bill.id}`, { method: 'DELETE' });
          if (response.ok) successCount++;
        } catch (error) {
          console.error('Error deleting bill:', error);
        }
      }
      toast.success(`Deleted ${successCount} of ${filteredRentalBills.length} rental bills`);
      fetchBills();
    } catch (error) {
      console.error('Error deleting bills:', error);
      toast.error("Failed to delete bills");
    }
  };

  const deleteAll = async () => {
    if (allFilteredBills.length === 0) {
      toast.error("No bills to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${allFilteredBills.length} bills${fromDate || toDate ? ' in the selected date range' : ''}?`)) {
      return;
    }

    try {
      await deleteAllSales();
      await deleteAllRental();
    } catch (error) {
      console.error('Error deleting bills:', error);
      toast.error("Failed to delete bills");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      <div className="space-y-6">
        {/* Date Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                      disabled={(date) => fromDate ? date < fromDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(fromDate || toDate) && (
                <Button variant="outline" onClick={clearDateFilter}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filter
                </Button>
              )}
            </div>

            {(fromDate || toDate) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">
                  Showing bills from {fromDate ? format(fromDate, "PPP") : "beginning"} to {toDate ? format(toDate, "PPP") : "now"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Download Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sales Bills */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Sales Bills</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredSalesBills.length} bills available
                    {(fromDate || toDate) && ` (filtered from ${salesBills.length} total)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadAllSales} disabled={filteredSalesBills.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download All Sales
                  </Button>
                  <Button variant="destructive" onClick={deleteAllSales} disabled={filteredSalesBills.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Sales
                  </Button>
                </div>
              </div>
              
              {/* Sales Bills Table */}
              {filteredSalesBills.length > 0 && (
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                          <TableCell>{format(parseISO(bill.billDate), "PPP")}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell>{bill.customerPhone}</TableCell>
                          <TableCell className="font-semibold">₹{bill.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bill.isPaid 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {bill.isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadBill(bill, "sales")}
                              disabled={downloadingId === bill.id}
                            >
                              {downloadingId === bill.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Rental Bills */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Rental Bills</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredRentalBills.length} bills available
                    {(fromDate || toDate) && ` (filtered from ${rentalBills.length} total)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadAllRental} disabled={filteredRentalBills.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download All Rental
                  </Button>
                  <Button variant="destructive" onClick={deleteAllRental} disabled={filteredRentalBills.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Rental
                  </Button>
                </div>
              </div>
              
              {/* Rental Bills Table */}
              {filteredRentalBills.length > 0 && (
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRentalBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                          <TableCell>{format(parseISO(bill.fromDate), "PPP")}</TableCell>
                          <TableCell>{bill.toDate ? format(parseISO(bill.toDate), "PPP") : "-"}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell>{bill.customerPhone}</TableCell>
                          <TableCell className="font-semibold">₹{bill.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bill.isPaid 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {bill.isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadBill(bill, "rental")}
                              disabled={downloadingId === bill.id}
                            >
                              {downloadingId === bill.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* All Bills */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">All Bills</h3>
                  <p className="text-sm text-muted-foreground">
                    {allFilteredBills.length} total bills
                    {(fromDate || toDate) && ` (filtered from ${salesBills.length + rentalBills.length} total)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadAll} size="lg" disabled={allFilteredBills.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Everything as PDF
                  </Button>
                  <Button variant="destructive" onClick={deleteAll} size="lg" disabled={allFilteredBills.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Everything
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Bills:</span>
                <span className="font-semibold">{salesBills.length + rentalBills.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Bills:</span>
                <span className="font-semibold">{salesBills.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Bills:</span>
                <span className="font-semibold">{rentalBills.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}