"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  customerAddress: string | null;
  items: BillItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RentalBill {
  id: number;
  serialNo: number;
  fromDate: string;
  toDate: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  items: BillItem[];
  subtotal: number;
  transportFees: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerBehaviorPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [rentalBills, setRentalBills] = useState<RentalBill[]>([]);
  
  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("shop_auth_token");
    if (!token) {
      router.push("/login?redirect=/customer-behavior");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Fetch bills with feedback
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBills = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all sales bills
        const salesResponse = await fetch("/api/sales-bills?limit=1000");
        if (!salesResponse.ok) throw new Error("Failed to fetch sales bills");
        const salesData = await salesResponse.json();
        setSalesBills(salesData);

        // Fetch all rental bills
        const rentalResponse = await fetch("/api/rental-bills?limit=1000");
        if (!rentalResponse.ok) throw new Error("Failed to fetch rental bills");
        const rentalData = await rentalResponse.json();
        setRentalBills(rentalData);
      } catch (error) {
        console.error("Error fetching bills:", error);
        toast.error("Failed to load customer behavior data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [isAuthenticated]);

  const allBills = useMemo(() => [...salesBills, ...rentalBills], [salesBills, rentalBills]);

  const feedbackStats = useMemo(() => {
    const veryGood = allBills.filter(b => b.customerFeedback === "very_good").length;
    const good = allBills.filter(b => b.customerFeedback === "good").length;
    const bad = allBills.filter(b => b.customerFeedback === "bad").length;
    const total = veryGood + good + bad;

    return {
      veryGood,
      good,
      bad,
      total,
      veryGoodPercent: total > 0 ? (veryGood / total) * 100 : 0,
      goodPercent: total > 0 ? (good / total) * 100 : 0,
      badPercent: total > 0 ? (bad / total) * 100 : 0,
    };
  }, [allBills]);

  const customerAnalytics = useMemo(() => {
    const customerMap = new Map();

    allBills.forEach(bill => {
      const existing = customerMap.get(bill.customerPhone) || {
        name: bill.customerName,
        phone: bill.customerPhone,
        totalSpent: 0,
        billCount: 0,
        feedbacks: [],
      };

      existing.totalSpent += bill.totalAmount + bill.advanceAmount;
      existing.billCount += 1;
      if (bill.customerFeedback) {
        existing.feedbacks.push(bill.customerFeedback);
      }

      customerMap.set(bill.customerPhone, existing);
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [allBills]);

  const filteredCustomerAnalytics = useMemo(() => {
    if (!searchQuery.trim()) return customerAnalytics;
    
    const lowerQuery = searchQuery.toLowerCase();
    return customerAnalytics.filter(customer =>
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(searchQuery)
    );
  }, [customerAnalytics, searchQuery]);

  const recentFeedbacks = useMemo(() => {
    return allBills
      .filter(bill => bill.customerFeedback)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [allBills]);

  const filteredRecentFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return recentFeedbacks;
    
    const lowerQuery = searchQuery.toLowerCase();
    return recentFeedbacks.filter(bill =>
      bill.customerName.toLowerCase().includes(lowerQuery) ||
      bill.customerPhone.includes(searchQuery)
    );
  }, [recentFeedbacks, searchQuery]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium">Loading customer behavior data...</div>
        </div>
      </div>
    );
  }

  const getFeedbackEmoji = (feedback: string) => {
    switch (feedback) {
      case "very_good": return "😊";
      case "good": return "🙂";
      case "bad": return "😞";
      default: return "";
    }
  };

  const getFeedbackLabel = (feedback: string) => {
    switch (feedback) {
      case "very_good": return "Very Good";
      case "good": return "Good";
      case "bad": return "Bad";
      default: return "";
    }
  };

  const getCustomerSentiment = (feedbacks: string[]) => {
    if (feedbacks.length === 0) return "No feedback";
    
    const veryGood = feedbacks.filter(f => f === "very_good").length;
    const bad = feedbacks.filter(f => f === "bad").length;
    
    if (veryGood > bad) return "Positive";
    if (bad > veryGood) return "Negative";
    return "Neutral";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Behavior Analytics</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Overall Feedback Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbackStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {allBills.length} total bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">😊 Very Good</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{feedbackStats.veryGood}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600"
                style={{ width: `${feedbackStats.veryGoodPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {feedbackStats.veryGoodPercent.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🙂 Good</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{feedbackStats.good}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600"
                style={{ width: `${feedbackStats.goodPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {feedbackStats.goodPercent.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">😞 Bad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{feedbackStats.bad}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600"
                style={{ width: `${feedbackStats.badPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {feedbackStats.badPercent.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Bill Count</TableHead>
                  <TableHead>Feedbacks</TableHead>
                  <TableHead>Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomerAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {searchQuery ? "No customers found" : "No customer data available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomerAnalytics.map((customer, index) => {
                    const sentiment = getCustomerSentiment(customer.feedbacks);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="font-semibold">₹{customer.totalSpent.toFixed(2)}</TableCell>
                        <TableCell>{customer.billCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {customer.feedbacks.map((f, i) => (
                              <span key={i} className="text-lg">
                                {getFeedbackEmoji(f)}
                              </span>
                            ))}
                            {customer.feedbacks.length === 0 && (
                              <span className="text-xs text-muted-foreground">No feedback</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              sentiment === "Positive" ? "default" : 
                              sentiment === "Negative" ? "destructive" : 
                              "secondary"
                            }
                          >
                            {sentiment}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customer Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecentFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No feedbacks found" : "No customer feedbacks yet"}
              </div>
            ) : (
              filteredRecentFeedbacks.map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {getFeedbackEmoji(bill.customerFeedback!)}
                    </div>
                    <div>
                      <div className="font-medium">{bill.customerName}</div>
                      <div className="text-sm text-muted-foreground">{bill.customerPhone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        bill.customerFeedback === "very_good" ? "default" : 
                        bill.customerFeedback === "bad" ? "destructive" : 
                        "secondary"
                      }
                    >
                      {getFeedbackLabel(bill.customerFeedback!)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Bill #{bill.serialNo}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}