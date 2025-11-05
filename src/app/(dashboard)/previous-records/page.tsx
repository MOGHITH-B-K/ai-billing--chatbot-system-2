"use client";

import { useState, useEffect, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Trash2, Filter, FileDown, Eye, Loader2, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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

function PreviousRecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<"sales" | "rental">("sales");
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>();
  const [filterToDate, setFilterToDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [rentalBills, setRentalBills] = useState<RentalBill[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [viewBill, setViewBill] = useState<{ bill: SalesBill | RentalBill; type: "sales" | "rental" } | null>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("shop_auth_token");
    if (!token) {
      router.push("/login?redirect=/previous-records");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  // Fetch bills with auto-refresh on URL change
  useEffect(() => {
    if (isAuthenticated) {
      fetchBills();
    }
  }, [isAuthenticated, searchParams]);

  const fetchBills = async () => {
    setLoadingData(true);
    try {
      const [salesRes, rentalRes] = await Promise.all([
        fetch('/api/sales-bills?limit=1000'),
        fetch('/api/rental-bills?limit=1000')
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
      setLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filterBills = <T extends { customerName: string; customerPhone: string; serialNo: number }>(
    bills: T[],
    dateField: keyof T
  ) => {
    return bills.filter(bill => {
      const matchesSearch = searchQuery.trim() === "" || 
        bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.customerPhone.includes(searchQuery) ||
        bill.serialNo.toString().includes(searchQuery);

      const billDate = new Date(bill[dateField] as string);
      const matchesDateRange = (!filterFromDate || billDate >= filterFromDate) &&
        (!filterToDate || billDate <= filterToDate);

      return matchesSearch && matchesDateRange;
    });
  };

  const filteredSalesBills = filterBills(salesBills, 'billDate');
  const filteredRentalBills = filterBills(rentalBills, 'fromDate');

  const handleDelete = (id: number, type: "sales" | "rental") => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const endpoint = deleteType === "sales" 
        ? `/api/sales-bills?id=${deleteId}` 
        : `/api/rental-bills?id=${deleteId}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        toast.success(`${deleteType === "sales" ? "Sales" : "Rental"} bill deleted successfully`);
        fetchBills();
      } else {
        throw new Error('Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
    
    setDeleteId(null);
  };

  const handleView = (bill: SalesBill | RentalBill, type: "sales" | "rental") => {
    try {
      // Get shop settings from localStorage or use defaults
      const shopProfile = JSON.parse(localStorage.getItem("shop_profile") || "{}");
      
      // Merge shop settings with bill data
      const billWithShopInfo = {
        ...bill,
        shopName: shopProfile.name || "SREE SAI DURGA",
        shopAddress: shopProfile.address || "MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203",
        shopPhone1: shopProfile.phone1 || "9790548669",
        shopPhone2: shopProfile.phone2 || "9442378669",
        shopLogoUrl: shopProfile.logo || "",
        shopQrUrl: shopProfile.paymentQRCode || "",
      };
      
      setViewBill({ bill: billWithShopInfo, type });
    } catch (error) {
      console.error('Error opening bill view:', error);
      toast.error('Failed to open bill view. Please try again.');
    }
  };

  const handleDownload = async (bill: SalesBill | RentalBill, type: "sales" | "rental") => {
    try {
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
      console.error('Error generating PDF:', error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handleDownloadAll = async (type: "sales" | "rental") => {
    const bills = type === "sales" ? filteredSalesBills : filteredRentalBills;
    
    if (bills.length === 0) {
      toast.error("No bills to download");
      return;
    }

    toast.info(`Downloading ${bills.length} bills...`);
    
    let successCount = 0;
    for (const bill of bills) {
      try {
        await handleDownload(bill, type);
        successCount++;
        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading bill:', error);
      }
    }
    
    toast.success(`Successfully downloaded ${successCount} of ${bills.length} bills as PDF`);
  };

  const handleDeleteAll = async () => {
    if (filteredSalesBills.length === 0) {
      toast.error("No bills to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${filteredSalesBills.length} filtered sales records? This action cannot be undone.`)) {
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
      toast.error('Failed to delete some bills');
    }
  };

  const handleDeleteAllRental = async () => {
    if (filteredRentalBills.length === 0) {
      toast.error("No bills to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${filteredRentalBills.length} filtered rental records? This action cannot be undone.`)) {
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
      toast.error('Failed to delete some bills');
    }
  };

  const handleEdit = (bill: SalesBill | RentalBill, type: "sales" | "rental") => {
    try {
      // Store bill data in localStorage for editing
      localStorage.setItem(`edit_${type}_bill`, JSON.stringify(bill));
      
      // Navigate to respective billing page
      router.push(`/${type}-billing?edit=${bill.id}`);
      toast.info(`Opening ${type} bill for editing...`);
    } catch (error) {
      console.error('Error opening bill for edit:', error);
      toast.error('Failed to open bill for editing. Please try again.');
    }
  };

  const formatBillNumber = (serialNo: number) => {
    return `#${String(serialNo).padStart(3, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster />
      
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">📋 Previous Records</h1>
          <p className="text-white/90">View and manage all your billing history</p>
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <CardTitle className="text-2xl">Search & Filter Bills</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Search by customer name, phone, or bill number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-12 text-base border-2"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 border-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {showFilters && (
            <Card className="mb-6 border-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-semibold mb-2 block">📅 From Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12 border-2">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterFromDate ? format(filterFromDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filterFromDate}
                          onSelect={setFilterFromDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold mb-2 block">📅 To Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12 border-2">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterToDate ? format(filterToDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filterToDate}
                          onSelect={setFilterToDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterFromDate(undefined);
                      setFilterToDate(undefined);
                    }}
                    className="h-12 px-6 border-2"
                  >
                    🔄 Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingData ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <div className="text-lg font-medium">Loading bills...</div>
            </div>
          ) : (
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="sales" className="text-base">
                  💰 Sales Billing ({filteredSalesBills.length})
                </TabsTrigger>
                <TabsTrigger value="rental" className="text-base">
                  🏠 Rental Billing ({filteredRentalBills.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-4">
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadAll("sales")} 
                    disabled={filteredSalesBills.length === 0}
                    className="h-10 border-2"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download All as PDF ({filteredSalesBills.length})
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAll} 
                    disabled={filteredSalesBills.length === 0}
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All ({filteredSalesBills.length})
                  </Button>
                </div>

                <div className="border-2 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900">
                      <TableRow>
                        <TableHead className="font-bold">Bill No</TableHead>
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold">Customer</TableHead>
                        <TableHead className="font-bold">Phone</TableHead>
                        <TableHead className="font-bold">Amount</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <div className="text-xl font-semibold">No records found</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSalesBills.map((bill) => (
                          <TableRow key={bill.id} className="hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
                            <TableCell className="font-bold text-purple-600 dark:text-purple-400">{formatBillNumber(bill.serialNo)}</TableCell>
                            <TableCell>{format(new Date(bill.billDate), "PPP")}</TableCell>
                            <TableCell className="font-semibold">{bill.customerName}</TableCell>
                            <TableCell>{bill.customerPhone}</TableCell>
                            <TableCell className="font-bold text-lg">₹{bill.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              {bill.isPaid ? (
                                <Badge variant="default" className="bg-green-500">✓ Paid</Badge>
                              ) : bill.advanceAmount > 0 ? (
                                <Badge variant="secondary" className="bg-orange-500 text-white">⏱️ Advance</Badge>
                              ) : (
                                <Badge variant="destructive">❌ Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(bill, "sales")}
                                  title="Edit Bill"
                                  className="border-2 hover:bg-orange-50 dark:hover:bg-orange-950"
                                >
                                  <Edit className="h-4 w-4 text-orange-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleView(bill, "sales")}
                                  title="View Bill"
                                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDownload(bill, "sales")}
                                  title="Download PDF"
                                  className="border-2 hover:bg-green-50 dark:hover:bg-green-950"
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(bill.id, "sales")}
                                  className="border-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="rental" className="space-y-4">
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadAll("rental")} 
                    disabled={filteredRentalBills.length === 0}
                    className="h-10 border-2"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download All as PDF ({filteredRentalBills.length})
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAllRental} 
                    disabled={filteredRentalBills.length === 0}
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All ({filteredRentalBills.length})
                  </Button>
                </div>

                <div className="border-2 rounded-xl overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900">
                      <TableRow>
                        <TableHead className="font-bold">Bill No</TableHead>
                        <TableHead className="font-bold">From Date</TableHead>
                        <TableHead className="font-bold">To Date</TableHead>
                        <TableHead className="font-bold">Customer</TableHead>
                        <TableHead className="font-bold">Phone</TableHead>
                        <TableHead className="font-bold">Amount</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRentalBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <div className="text-xl font-semibold">No records found</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRentalBills.map((bill) => (
                          <TableRow key={bill.id} className="hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
                            <TableCell className="font-bold text-purple-600 dark:text-purple-400">{formatBillNumber(bill.serialNo)}</TableCell>
                            <TableCell>{format(new Date(bill.fromDate), "PPP")}</TableCell>
                            <TableCell>
                              {bill.toDate ? format(new Date(bill.toDate), "PPP") : <Badge variant="secondary">Ongoing</Badge>}
                            </TableCell>
                            <TableCell className="font-semibold">{bill.customerName}</TableCell>
                            <TableCell>{bill.customerPhone}</TableCell>
                            <TableCell className="font-bold text-lg">₹{bill.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              {bill.isPaid ? (
                                <Badge variant="default" className="bg-green-500">✓ Paid</Badge>
                              ) : bill.advanceAmount > 0 ? (
                                <Badge variant="secondary" className="bg-orange-500 text-white">⏱️ Advance</Badge>
                              ) : (
                                <Badge variant="destructive">❌ Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(bill, "rental")}
                                  title="Edit Bill"
                                  className="border-2 hover:bg-orange-50 dark:hover:bg-orange-950"
                                >
                                  <Edit className="h-4 w-4 text-orange-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleView(bill, "rental")}
                                  title="View Bill"
                                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDownload(bill, "rental")}
                                  title="Download PDF"
                                  className="border-2 hover:bg-green-50 dark:hover:bg-green-950"
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(bill.id, "rental")}
                                  className="border-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* View Bill Dialog - Enhanced */}
      <Dialog open={!!viewBill} onOpenChange={() => setViewBill(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-center">
              🧾 {viewBill?.type === "sales" ? "Sales" : "Rental"} Bill {viewBill?.bill ? formatBillNumber(viewBill.bill.serialNo) : "N/A"}
            </DialogTitle>
          </DialogHeader>
          {viewBill?.bill && (
            <div className="space-y-6 p-4">
              {/* Shop Header with gradient background */}
              <div className="text-center border-2 rounded-xl p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950">
                {viewBill.bill.shopLogoUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={viewBill.bill.shopLogoUrl} 
                      alt="Shop Logo" 
                      className="h-32 object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {viewBill.bill.shopName || 'SREE SAI DURGA'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  {viewBill.bill.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203'}
                </p>
                <p className="text-sm text-muted-foreground font-semibold mt-1">
                  📞 {viewBill.bill.shopPhone1 || '9790548669'}, {viewBill.bill.shopPhone2 || '9442378669'}
                </p>
              </div>

              {/* Bill Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground font-semibold">📝 Bill Number</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatBillNumber(viewBill.bill.serialNo)}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground font-semibold">
                      📅 {viewBill.type === "sales" ? "Date" : "From Date"}
                    </p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {viewBill.type === "sales" && (viewBill.bill as SalesBill).billDate
                        ? formatDate((viewBill.bill as SalesBill).billDate)
                        : viewBill.type === "rental" && (viewBill.bill as RentalBill).fromDate
                        ? formatDate((viewBill.bill as RentalBill).fromDate)
                        : "N/A"}
                    </p>
                  </CardContent>
                </Card>
                {viewBill.type === "rental" && (viewBill.bill as RentalBill).toDate && (
                  <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 col-span-2">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground font-semibold">📅 To Date</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatDate((viewBill.bill as RentalBill).toDate!)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Customer Info */}
              <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
                <CardHeader>
                  <h3 className="text-xl font-bold">👤 Customer Details</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground font-semibold min-w-[100px]">Name:</span>
                    <span className="font-bold text-lg">{viewBill.bill.customerName || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground font-semibold min-w-[100px]">Phone:</span>
                    <span className="font-bold text-lg">{viewBill.bill.customerPhone || "N/A"}</span>
                  </div>
                  {viewBill.bill.customerAddress && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-semibold min-w-[100px]">Address:</span>
                      <span className="font-medium">{viewBill.bill.customerAddress}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                  <h3 className="text-xl font-bold">🛒 Items</h3>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold">S.No</TableHead>
                        <TableHead className="font-bold">Item Name</TableHead>
                        <TableHead className="text-right font-bold">Qty</TableHead>
                        <TableHead className="text-right font-bold">Rate</TableHead>
                        <TableHead className="text-right font-bold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(viewBill.bill.items && Array.isArray(viewBill.bill.items) ? viewBill.bill.items : []).map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-semibold">{index + 1}</TableCell>
                          <TableCell className="font-semibold">{item?.itemName || "N/A"}</TableCell>
                          <TableCell className="text-right font-medium">{item?.qty || 0}</TableCell>
                          <TableCell className="text-right font-medium">₹{(item?.rate || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-lg">₹{(item?.amount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Totals Card */}
              <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardContent className="pt-6">
                  <div className="space-y-3 max-w-md ml-auto">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">₹{((viewBill.bill.subtotal || 0) || (viewBill.bill.items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0)).toFixed(2)}</span>
                    </div>
                    {viewBill.type === "rental" && (viewBill.bill as RentalBill).transportFees !== undefined && (
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Transport Fees:</span>
                        <span className="font-bold">₹{((viewBill.bill as RentalBill).transportFees || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Tax ({viewBill.bill.taxType || "GST"} @ {viewBill.bill.taxPercentage || 0}%):</span>
                      <span className="font-bold">₹{(viewBill.bill.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    {(viewBill.bill.advanceAmount || 0) > 0 && (
                      <div className="flex justify-between text-lg text-orange-600 dark:text-orange-400">
                        <span className="font-semibold">Advance:</span>
                        <span className="font-bold">-₹{(viewBill.bill.advanceAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t-4 border-green-600 dark:border-green-400 pt-3 mt-2">
                      <div className="flex justify-between text-2xl">
                        <span className="font-bold">Total Amount:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          ₹{(() => {
                            const subtotal = viewBill.bill.subtotal || viewBill.bill.items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
                            const transport = viewBill.type === "rental" ? ((viewBill.bill as RentalBill).transportFees || 0) : 0;
                            const tax = viewBill.bill.taxAmount || 0;
                            const advance = viewBill.bill.advanceAmount || 0;
                            const total = subtotal + transport + tax - advance;
                            return total.toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg">Payment Status:</span>
                      <Badge 
                        variant={viewBill.bill.isPaid ? "default" : "destructive"}
                        className={`text-base px-4 py-2 ${viewBill.bill.isPaid ? 'bg-green-500' : 'bg-red-500'}`}
                      >
                        {viewBill.bill.isPaid ? "✓ FULLY PAID" : "❌ PENDING"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code */}
              {viewBill.bill.shopQrUrl && (
                <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xl font-bold mb-4">📱 Scan to Pay</p>
                    <div className="flex justify-center">
                      <img 
                        src={viewBill.bill.shopQrUrl} 
                        alt="Payment QR" 
                        className="h-64 object-contain rounded-lg shadow-xl border-4 border-white dark:border-gray-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t-2 pt-6">
                <Button variant="outline" onClick={() => setViewBill(null)} className="h-12 px-6 border-2">
                  ❌ Close
                </Button>
                <Button 
                  onClick={() => {
                    if (viewBill?.bill) {
                      handleDownload(viewBill.bill, viewBill.type);
                    }
                  }}
                  className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PreviousRecordsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium">Loading records...</div>
        </div>
      </div>
    }>
      <PreviousRecordsContent />
    </Suspense>
  );
}