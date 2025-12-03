"use client";

import * as React from "react";
import {
  ShoppingCart,
  Clock,
  History,
  Download,
  Calendar,
  AlertCircle,
  DollarSign,
  CheckCircle,
  BarChart3,
  Package,
  Users,
  MessageSquare,
  Store,
  HardDrive,
  Crown,
  LogOut,
  Settings,
  FileOutput,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/database";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Sales Billing", url: "/sales-billing", icon: ShoppingCart },
  { title: "Rental Billing", url: "/rental-billing", icon: Clock },
  { title: "Bookings", url: "/bookings", icon: Bookmark },
  { title: "Previous Records", url: "/previous-records", icon: History },
  { title: "Downloads", url: "/downloads", icon: Download },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Pending", url: "/pending", icon: AlertCircle },
  { title: "Advance", url: "/advance", icon: DollarSign },
  { title: "Fully Paid", url: "/fully-paid", icon: CheckCircle },
  { title: "Overall Sales", url: "/overall-sales", icon: BarChart3 },
  { title: "Product Details", url: "/product-details", icon: Package },
  { title: "Customer Details", url: "/customer-details", icon: Users },
  { title: "Customer Behavior", url: "/customer-behavior", icon: Users },
  { title: "Chat Bot", url: "/chatbot", icon: MessageSquare },
  { title: "Export", url: "/export", icon: FileOutput },
  { title: "Storage", url: "/storage", icon: HardDrive },
  { title: "Settings", url: "/settings", icon: Settings },
];

const MAX_STORAGE_GB = 10;
const MAX_STORAGE_MB = MAX_STORAGE_GB * 1024;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [storageStats, setStorageStats] = React.useState({
    usedMB: 0,
    usedPercent: 0,
    remainingMB: MAX_STORAGE_MB,
    totalRecords: 0,
    estimatedCapacity: 0,
  });

  const handleSignOut = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("shop_auth_token");
      
      if (token) {
        await fetch("/api/auth/admin/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("shop_auth_token");
      localStorage.removeItem("shop_user");
      localStorage.removeItem("shop_authenticated");
      localStorage.removeItem("bearer_token");
      
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const calculateStorage = React.useCallback(() => {
    try {
      const salesBills = db.getSalesBills();
      const rentalBills = db.getRentalBills();
      const customers = db.getCustomers();
      const products = db.getProducts();
      const bookings = db.getBookings();
      
      const allData = {
        salesBills,
        rentalBills,
        customers,
        products,
        bookings,
      };
      
      const totalSize = new Blob([JSON.stringify(allData)]).size;
      const usedMB = totalSize / (1024 * 1024);
      const remainingMB = MAX_STORAGE_MB - usedMB;
      const usedPercent = (usedMB / MAX_STORAGE_MB) * 100;
      
      const totalRecords = salesBills.length + rentalBills.length;
      const avgRecordSize = totalRecords > 0 ? totalSize / totalRecords : 5000;
      const estimatedCapacity = Math.floor(remainingMB * 1024 * 1024 / avgRecordSize);
      
      setStorageStats({
        usedMB: parseFloat(usedMB.toFixed(2)),
        usedPercent: parseFloat(usedPercent.toFixed(2)),
        remainingMB: parseFloat(remainingMB.toFixed(2)),
        totalRecords,
        estimatedCapacity,
      });
    } catch (error) {
      console.error("Error calculating storage:", error);
    }
  }, []);

  React.useEffect(() => {
    calculateStorage();
    // Update every 10 seconds instead of 5 for better performance
    const interval = setInterval(calculateStorage, 10000);
    return () => clearInterval(interval);
  }, [calculateStorage]);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-sidebar-foreground">SREE SAI DURGA</h2>
            <p className="text-xs text-sidebar-foreground/60">Shop Billing System</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-sidebar-foreground/70 leading-relaxed">
          <p className="font-medium">MAIN ROAD, THIRUVENNAI NALLUR</p>
          <p>VILLUPURAM Dt, KT - 607203</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span>📞 9790548669</span>
            <span>📞 9442378669</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/pricing"}>
                  <Link href="/pricing">
                    <Crown className="h-4 w-4" />
                    <span>Pricing & Plans</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-sidebar-foreground/60" />
            <span className="text-sm font-medium text-sidebar-foreground">Storage Space</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-sidebar-foreground/70">
              <span>Used: {storageStats.usedMB} MB</span>
              <span>{storageStats.usedPercent.toFixed(1)}%</span>
            </div>
            
            <div className="h-2 bg-sidebar-accent rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(storageStats.usedPercent, 100)}%` }}
              />
            </div>
            
            <div className="text-xs text-sidebar-foreground/70">
              <div>Remaining: {storageStats.remainingMB.toLocaleString()} MB</div>
              <div className="mt-1">Total Records: {storageStats.totalRecords}</div>
              <div className="mt-1 font-medium text-sidebar-foreground">
                Est. Capacity: ~{storageStats.estimatedCapacity.toLocaleString()} more records
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}