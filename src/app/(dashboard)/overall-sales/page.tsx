"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

interface Bill {
  id: number;
  serialNo: number;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  advanceAmount: number;
  isPaid: boolean;
  createdAt: string;
  billDate?: string;
  fromDate?: string;
}

export default function OverallSalesPage() {
  const [salesBills, setSalesBills] = useState<Bill[]>([]);
  const [rentalBills, setRentalBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const [salesRes, rentalRes] = await Promise.all([
        fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (salesRes.ok && rentalRes.ok) {
        const salesData = await salesRes.json();
        const rentalData = await rentalRes.json();
        setSalesBills(salesData.bills || []);
        setRentalBills(rentalData.bills || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const salesStats = useMemo(() => {
    const total = salesBills.reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
    const paid = salesBills.filter(b => b.isPaid).reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
    const pending = salesBills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.totalAmount, 0);
    const advance = salesBills.filter(b => !b.isPaid && b.advanceAmount > 0).reduce((sum, bill) => sum + bill.advanceAmount, 0);

    return { total, paid, pending, advance, count: salesBills.length };
  }, [salesBills]);

  const rentalStats = useMemo(() => {
    const total = rentalBills.reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
    const paid = rentalBills.filter(b => b.isPaid).reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);
    const pending = rentalBills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.totalAmount, 0);
    const advance = rentalBills.filter(b => !b.isPaid && b.advanceAmount > 0).reduce((sum, bill) => sum + bill.advanceAmount, 0);

    return { total, paid, pending, advance, count: rentalBills.length };
  }, [rentalBills]);

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const salesTotal = salesBills
        .filter(bill => {
          const billDate = new Date(bill.billDate || bill.createdAt);
          return billDate >= monthStart && billDate <= monthEnd;
        })
        .reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);

      const rentalTotal = rentalBills
        .filter(bill => {
          const billDate = new Date(bill.fromDate || bill.createdAt);
          return billDate >= monthStart && billDate <= monthEnd;
        })
        .reduce((sum, bill) => sum + (bill.totalAmount + bill.advanceAmount), 0);

      months.push({
        month: format(date, "MMM yyyy"),
        sales: salesTotal,
        rental: rentalTotal,
        total: salesTotal + rentalTotal,
      });
    }
    return months;
  }, [salesBills, rentalBills]);

  const topCustomers = useMemo(() => {
    const customerMap = new Map();

    [...salesBills, ...rentalBills].forEach(bill => {
      const existing = customerMap.get(bill.customerPhone) || {
        name: bill.customerName,
        phone: bill.customerPhone,
        total: 0,
        count: 0,
      };
      existing.total += bill.totalAmount + bill.advanceAmount;
      existing.count += 1;
      customerMap.set(bill.customerPhone, existing);
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [salesBills, rentalBills]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Overall Sales Dashboard</h1>

      {/* Combined Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(salesStats.total + rentalStats.total).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {salesStats.count + rentalStats.count} total bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(salesStats.paid + rentalStats.paid).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{(salesStats.pending + rentalStats.pending).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding dues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Advance Amount</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{(salesStats.advance + rentalStats.advance).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Advance payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales vs Rental Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Sales vs Rental Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales">Sales Dashboard</TabsTrigger>
              <TabsTrigger value="rental">Rental Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Bills</div>
                    <div className="text-2xl font-bold mt-2">{salesStats.count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                    <div className="text-2xl font-bold mt-2">₹{salesStats.total.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Paid</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">₹{salesStats.paid.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Pending</div>
                    <div className="text-2xl font-bold text-red-600 mt-2">₹{salesStats.pending.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rental" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Bills</div>
                    <div className="text-2xl font-bold mt-2">{rentalStats.count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                    <div className="text-2xl font-bold mt-2">₹{rentalStats.total.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Paid</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">₹{rentalStats.paid.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Pending</div>
                    <div className="text-2xl font-bold text-red-600 mt-2">₹{rentalStats.pending.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => {
              const maxValue = Math.max(...monthlyData.map(m => m.total));
              const percentage = maxValue > 0 ? (month.total / maxValue) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="font-semibold">₹{month.total.toFixed(2)}</span>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between px-3 text-white text-xs font-medium"
                      style={{ width: `${percentage}%` }}
                    >
                      <span>Sales: ₹{month.sales.toFixed(0)}</span>
                      <span>Rental: ₹{month.rental.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">₹{customer.total.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{customer.count} bills</div>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No customer data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}