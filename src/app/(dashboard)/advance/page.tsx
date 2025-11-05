"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Search, CheckCircle, Loader2 } from "lucide-react";
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

export default function AdvancePage() {
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [rentalBills, setRentalBills] = useState<RentalBill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    type: 'sales' | 'rental';
    bill: SalesBill | RentalBill | null;
  }>({ open: false, type: 'sales', bill: null });

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const [salesRes, rentalRes] = await Promise.all([
        fetch('/api/sales-bills?isPaid=false&limit=1000'),
        fetch('/api/rental-bills?isPaid=false&limit=1000')
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        // Filter for advance only (has advance amount)
        setSalesBills(salesData.filter((bill: SalesBill) => bill.advanceAmount > 0));
      }

      if (rentalRes.ok) {
        const rentalData = await rentalRes.json();
        // Filter for advance only (has advance amount)
        setRentalBills(rentalData.filter((bill: RentalBill) => bill.advanceAmount > 0));
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalesBills = salesBills.filter(bill =>
    bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customerPhone.includes(searchQuery) ||
    bill.serialNo.toString().includes(searchQuery)
  );

  const filteredRentalBills = rentalBills.filter(bill =>
    bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customerPhone.includes(searchQuery) ||
    bill.serialNo.toString().includes(searchQuery)
  );

  const handleMarkAsPaid = async () => {
    if (!editDialog.bill) return;

    try {
      const endpoint = editDialog.type === 'sales' 
        ? `/api/sales-bills?id=${editDialog.bill.id}`
        : `/api/rental-bills?id=${editDialog.bill.id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true })
      });

      if (response.ok) {
        toast.success(`${editDialog.type === 'sales' ? 'Sales' : 'Rental'} Bill #${editDialog.bill.serialNo} marked as fully paid!`);
        setEditDialog({ open: false, type: 'sales', bill: null });
        loadBills();
      } else {
        throw new Error('Failed to update bill');
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    }
  };

  const salesAdvance = filteredSalesBills.reduce((sum, bill) => sum + bill.advanceAmount, 0);
  const rentalAdvance = filteredRentalBills.reduce((sum, bill) => sum + bill.advanceAmount, 0);
  const salesRemaining = filteredSalesBills.reduce((sum, bill) => sum + (bill.totalAmount), 0);
  const rentalRemaining = filteredRentalBills.reduce((sum, bill) => sum + (bill.totalAmount), 0);

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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sales Advance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{salesAdvance.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">{filteredSalesBills.length} bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rental Advance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{rentalAdvance.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">{filteredRentalBills.length} bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Advance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{(salesAdvance + rentalAdvance).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Remaining Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">₹{(salesRemaining + rentalRemaining).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Advance Payment Bills</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or bill no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">Sales ({filteredSalesBills.length})</TabsTrigger>
              <TabsTrigger value="rental">Rental ({filteredRentalBills.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Advance Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalesBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No sales bills with advance payment
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalesBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                        <TableCell>{format(new Date(bill.billDate), "PPP")}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{bill.customerPhone}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ₹{bill.advanceAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          ₹{bill.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{(bill.totalAmount + bill.advanceAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialog({ open: true, type: 'sales', bill })}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
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
                    <TableHead>Advance Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRentalBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No rental bills with advance payment
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRentalBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">#{bill.serialNo}</TableCell>
                        <TableCell>{format(new Date(bill.fromDate), "PPP")}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{bill.customerPhone}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ₹{bill.advanceAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          ₹{bill.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{(bill.totalAmount + bill.advanceAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialog({ open: true, type: 'rental', bill })}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bill Payment Status</DialogTitle>
          </DialogHeader>
          {editDialog.bill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Bill No:</Label>
                  <div className="font-semibold">#{editDialog.bill.serialNo}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer:</Label>
                  <div className="font-semibold">{editDialog.bill.customerName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone:</Label>
                  <div className="font-semibold">{editDialog.bill.customerPhone}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Advance Paid:</Label>
                  <div className="font-semibold text-green-600">₹{editDialog.bill.advanceAmount.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Remaining:</Label>
                  <div className="font-semibold text-orange-600">₹{editDialog.bill.totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total:</Label>
                  <div className="font-semibold">₹{(editDialog.bill.totalAmount + editDialog.bill.advanceAmount).toFixed(2)}</div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  Mark this bill as <span className="font-bold text-green-600">Fully Paid</span>?
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, type: 'sales', bill: null })}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Fully Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}