"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalSales: number;
  totalRentals: number;
  totalRevenue: number;
  pendingPayments: number;
  todaySales: number;
  todayRentals: number;
}

interface RecentBill {
  id: number;
  type: 'sales' | 'rental';
  serialNo: number;
  customerName: string;
  totalAmount: number;
  isPaid: boolean;
  billDate: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [salesBills, setSalesBills] = useState<any[]>([]);
  const [rentalBills, setRentalBills] = useState<any[]>([]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("shop_auth_token");
    if (!token) {
      router.push("/login?redirect=/");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  // Load data once
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        const [salesRes, rentalRes] = await Promise.all([
          fetch('/api/sales-bills'),
          fetch('/api/rental-bills')
        ]);

        const [sales, rentals] = await Promise.all([
          salesRes.ok ? salesRes.json() : [],
          rentalRes.ok ? rentalRes.json() : []
        ]);

        setSalesBills(sales);
        setRentalBills(rentals);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setSalesBills([]);
        setRentalBills([]);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Memoize stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySalesCount = salesBills.filter(bill => 
      new Date(bill.billDate) >= today
    ).length;

    const todayRentalsCount = rentalBills.filter(bill => 
      new Date(bill.fromDate) >= today
    ).length;

    const totalSalesRevenue = salesBills.reduce((sum, bill) => 
      sum + (bill.totalAmount || 0), 0
    );

    const totalRentalsRevenue = rentalBills.reduce((sum, bill) => 
      sum + (bill.totalAmount || 0), 0
    );

    const pendingAmount = [...salesBills, ...rentalBills]
      .filter(bill => !bill.isPaid)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

    return {
      totalSales: salesBills.length,
      totalRentals: rentalBills.length,
      totalRevenue: totalSalesRevenue + totalRentalsRevenue,
      pendingPayments: pendingAmount,
      todaySales: todaySalesCount,
      todayRentals: todayRentalsCount
    };
  }, [salesBills, rentalBills]);

  // Memoize recent bills
  const recentBills = useMemo(() => {
    const allBills = [
      ...salesBills.map(bill => ({ ...bill, type: 'sales' as const })),
      ...rentalBills.map(bill => ({ ...bill, type: 'rental' as const, billDate: bill.fromDate }))
    ];

    return allBills
      .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
      .slice(0, 5);
  }, [salesBills, rentalBills]);

  // Memoize navigation handlers
  const navigateTo = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const quickActions = [
    {
      title: "Sales Billing",
      icon: ShoppingCart,
      href: "/sales-billing",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
      description: "Create new sales bill"
    },
    {
      title: "Rental Billing",
      icon: Package,
      href: "/rental-billing",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
      description: "Create new rental bill"
    },
    {
      title: "Previous Records",
      icon: FileText,
      href: "/previous-records",
      color: "text-green-600 bg-green-50 dark:bg-green-950",
      description: "View all bills"
    },
    {
      title: "Product Details",
      icon: Package,
      href: "/product-details",
      color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
      description: "Manage products"
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/calendar",
      color: "text-pink-600 bg-pink-50 dark:bg-pink-950",
      description: "Pre-book events"
    },
    {
      title: "Overall Sales",
      icon: TrendingUp,
      href: "/overall-sales",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950",
      description: "View analytics"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">SREE SAI DURGA</h1>
        <p className="text-muted-foreground">
          Shop Billing System Dashboard - {format(new Date(), "MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Bills</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.todaySales} bills today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rental Bills</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRentals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.todayRentals} bills today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{stats.pendingPayments.toFixed(2)}
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => navigateTo('/pending')}
            >
              View pending bills →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSales + stats.totalRentals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sales + Rental combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todaySales + stats.todayRentals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bills created today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="h-auto py-6 flex flex-col items-start gap-2"
                onClick={() => navigateTo(action.href)}
              >
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Bills</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateTo('/previous-records')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bills created yet</p>
              <p className="text-sm mt-1">Create your first bill to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBills.map((bill) => (
                <div
                  key={`${bill.type}-${bill.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigateTo('/previous-records')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      bill.type === 'sales' 
                        ? 'bg-blue-50 dark:bg-blue-950' 
                        : 'bg-purple-50 dark:bg-purple-950'
                    }`}>
                      {bill.type === 'sales' ? (
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Package className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {bill.type === 'sales' ? 'Sales' : 'Rental'} Bill #{bill.serialNo}
                        </span>
                        <Badge variant={bill.isPaid ? "default" : "secondary"}>
                          {bill.isPaid ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {bill.customerName} • {format(new Date(bill.billDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">₹{bill.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-900 dark:text-green-100">System Active</div>
                <div className="text-xs text-green-700 dark:text-green-300">All features operational</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-100">Multi-User Ready</div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Secure authentication</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-900 dark:text-purple-100">Analytics Ready</div>
                <div className="text-xs text-purple-700 dark:text-purple-300">Track all metrics</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}