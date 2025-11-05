"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import * as XLSX from "xlsx";

export default function ExportPage() {
  const [stats, setStats] = useState({
    salesCount: 0,
    rentalCount: 0,
    customersCount: 0,
    productsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const [salesRes, rentalRes, customersRes, productsRes] = await Promise.all([
        fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/customers", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/products", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);

      if (salesRes.ok && rentalRes.ok && customersRes.ok && productsRes.ok) {
        const [salesData, rentalData, customersData, productsData] = await Promise.all([
          salesRes.json(),
          rentalRes.json(),
          customersRes.json(),
          productsRes.json(),
        ]);

        setStats({
          salesCount: salesData.bills?.length || 0,
          rentalCount: rentalData.bills?.length || 0,
          customersCount: customersData.customers?.length || 0,
          productsCount: productsData.products?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch all data
      const [salesRes, rentalRes, customersRes, productsRes] = await Promise.all([
        fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/customers", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/products", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);

      if (!salesRes.ok || !rentalRes.ok || !customersRes.ok || !productsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [salesData, rentalData, customersData, productsData] = await Promise.all([
        salesRes.json(),
        rentalRes.json(),
        customersRes.json(),
        productsRes.json(),
      ]);

      const salesBills = salesData.bills || [];
      const rentalBills = rentalData.bills || [];
      const customers = customersData.customers || [];
      const products = productsData.products || [];

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sales Bills Sheet
      const salesExportData = salesBills.map((bill: any) => ({
        "Serial No": bill.serialNo,
        "Date": new Date(bill.billDate).toLocaleDateString(),
        "Customer Name": bill.customerName,
        "Customer Phone": bill.customerPhone,
        "Customer Address": bill.customerAddress || "",
        "Items": JSON.stringify(bill.items),
        "Subtotal": bill.subtotal,
        "Tax Amount": bill.taxAmount,
        "Tax Type": bill.taxType || "",
        "Advance Amount": bill.advanceAmount,
        "Total Amount": bill.totalAmount,
        "Is Paid": bill.isPaid ? "Yes" : "No",
        "Customer Feedback": bill.customerFeedback || "",
        "Created At": new Date(bill.createdAt).toLocaleString()
      }));
      const salesSheet = XLSX.utils.json_to_sheet(salesExportData);
      XLSX.utils.book_append_sheet(wb, salesSheet, "Sales Bills");

      // Rental Bills Sheet
      const rentalExportData = rentalBills.map((bill: any) => ({
        "Serial No": bill.serialNo,
        "From Date": new Date(bill.fromDate).toLocaleDateString(),
        "To Date": bill.toDate ? new Date(bill.toDate).toLocaleDateString() : "",
        "Customer Name": bill.customerName,
        "Customer Phone": bill.customerPhone,
        "Customer Address": bill.customerAddress || "",
        "Items": JSON.stringify(bill.items),
        "Subtotal": bill.subtotal,
        "Transport Fees": bill.transportFees || 0,
        "Tax Amount": bill.taxAmount,
        "Tax Type": bill.taxType || "",
        "Advance Amount": bill.advanceAmount,
        "Total Amount": bill.totalAmount,
        "Is Paid": bill.isPaid ? "Yes" : "No",
        "Customer Feedback": bill.customerFeedback || "",
        "Created At": new Date(bill.createdAt).toLocaleString()
      }));
      const rentalSheet = XLSX.utils.json_to_sheet(rentalExportData);
      XLSX.utils.book_append_sheet(wb, rentalSheet, "Rental Bills");

      // Customers Sheet
      const customersExportData = customers.map((customer: any) => ({
        "ID": customer.id,
        "Name": customer.name,
        "Phone": customer.phone,
        "Address": customer.address || "",
        "Created At": new Date(customer.createdAt).toLocaleString()
      }));
      const customersSheet = XLSX.utils.json_to_sheet(customersExportData);
      XLSX.utils.book_append_sheet(wb, customersSheet, "Customers");

      // Products Sheet
      const productsExportData = products.map((product: any) => ({
        "ID": product.id,
        "Name": product.name,
        "Rate": product.rate,
        "Category": product.category || "",
        "Product Type": product.productType,
        "Stock Quantity": product.stockQuantity,
        "Created At": new Date(product.createdAt).toLocaleString()
      }));
      const productsSheet = XLSX.utils.json_to_sheet(productsExportData);
      XLSX.utils.book_append_sheet(wb, productsSheet, "Products");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `SREE_SAI_DURGA_Backup_${timestamp}.xlsx`;

      // Write and download
      XLSX.writeFile(wb, filename);

      toast.success(`Data exported successfully! File: ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Export</h1>
          <p className="text-muted-foreground">
            Export your data for backup or analysis
          </p>
        </div>

        {/* Current Data Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sales Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.salesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rental Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.rentalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.customersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.productsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export All Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex gap-2 items-start">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Export all your data to Excel format
                  </p>
                  <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                    <li>All sales bills, rental bills, customers, and products</li>
                    <li>Organized in separate sheets for easy access</li>
                    <li>Perfect for backup, analysis, or migration</li>
                    <li>Includes all transaction details and timestamps</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={exportToExcel} 
              size="lg" 
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting Data...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data to Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">📦 Backup & Security</h4>
                <p className="text-sm text-muted-foreground">
                  Export your data regularly as a backup. Keep your business data safe and secure
                  with downloadable Excel files stored on your local system.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Data Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Use Excel's powerful features to analyze your sales trends, customer behavior, 
                  and product performance with advanced formulas and pivot tables.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📈 Business Intelligence</h4>
                <p className="text-sm text-muted-foreground">
                  Import exported data into BI tools for advanced analytics, custom dashboards,
                  and comprehensive business insights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔄 Data Migration</h4>
                <p className="text-sm text-muted-foreground">
                  Export data for migration to other systems or for sharing with accountants
                  and business partners in a universally compatible format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• All data is exported from the cloud database (Turso)</li>
              <li>• The exported file includes all your current records at the time of export</li>
              <li>• Store exported files securely as they contain sensitive business information</li>
              <li>• You can manage your database through the "Database Studio" tab at the top right</li>
              <li>• Regular exports are recommended for data backup purposes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}