"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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
  taxAmount: number;
  taxType?: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
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
  taxAmount: number;
  taxType?: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
}

export default function FullyPaidPage() {
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [rentalBills, setRentalBills] = useState<RentalBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const [salesRes, rentalRes] = await Promise.all([
        fetch('/api/sales-bills?isPaid=true&limit=1000'),
        fetch('/api/rental-bills?isPaid=true&limit=1000')
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
      setLoading(false);
    }
  };

  const salesTotal = salesBills.reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
  const rentalTotal = rentalBills.reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
  const grandTotal = salesTotal + rentalTotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sales Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{salesTotal.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">{salesBills.length} bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rental Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{rentalTotal.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">{rentalBills.length} bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">{salesBills.length + rentalBills.length} bills</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fully Paid Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">Sales ({salesBills.length})</TabsTrigger>
              <TabsTrigger value="rental">Rental ({rentalBills.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No fully paid sales bills
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                        <TableCell>{format(new Date(bill.billDate), "PPP")}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{bill.customerPhone}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{(bill.totalAmount + bill.advanceAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="rental">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No fully paid rental bills
                      </TableCell>
                    </TableRow>
                  ) : (
                    rentalBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                        <TableCell>{format(new Date(bill.fromDate), "PPP")}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{bill.customerPhone}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{(bill.totalAmount + bill.advanceAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}