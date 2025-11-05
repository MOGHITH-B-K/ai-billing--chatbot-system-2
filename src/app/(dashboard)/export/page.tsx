"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/database";
import { Download, Upload, FileSpreadsheet, Database, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import * as XLSX from "xlsx";

export default function ExportPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const exportToExcel = () => {
    try {
      // Get all data
      const salesBills = db.getSalesBills();
      const rentalBills = db.getRentalBills();
      const customers = db.getCustomers();
      const products = db.getProducts();

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sales Bills Sheet
      const salesData = salesBills.map(bill => ({
        "Serial No": bill.serialNo,
        "Date": new Date(bill.date).toLocaleDateString(),
        "Customer Name": bill.customerName,
        "Customer Phone": bill.customerPhone,
        "Customer Address": bill.customerAddress,
        "Items": JSON.stringify(bill.items),
        "Subtotal": bill.subtotal,
        "Tax Amount": bill.taxAmount,
        "Tax Type": bill.taxType,
        "Advance Amount": bill.advanceAmount,
        "Total Amount": bill.totalAmount,
        "Is Paid": bill.isPaid ? "Yes" : "No",
        "Customer Feedback": bill.customerFeedback || "",
        "Created At": new Date(bill.createdAt).toLocaleString()
      }));
      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, salesSheet, "Sales Bills");

      // Rental Bills Sheet
      const rentalData = rentalBills.map(bill => ({
        "Serial No": bill.serialNo,
        "From Date": new Date(bill.fromDate).toLocaleDateString(),
        "To Date": bill.toDate ? new Date(bill.toDate).toLocaleDateString() : "",
        "Customer Name": bill.customerName,
        "Customer Phone": bill.customerPhone,
        "Customer Address": bill.customerAddress,
        "Items": JSON.stringify(bill.items),
        "Subtotal": bill.subtotal,
        "Transport Fees": bill.transportFees || 0,
        "Tax Amount": bill.taxAmount,
        "Tax Type": bill.taxType,
        "Advance Amount": bill.advanceAmount,
        "Total Amount": bill.totalAmount,
        "Is Paid": bill.isPaid ? "Yes" : "No",
        "Customer Feedback": bill.customerFeedback || "",
        "Created At": new Date(bill.createdAt).toLocaleString()
      }));
      const rentalSheet = XLSX.utils.json_to_sheet(rentalData);
      XLSX.utils.book_append_sheet(wb, rentalSheet, "Rental Bills");

      // Customers Sheet
      const customersData = customers.map(customer => ({
        "ID": customer.id,
        "Name": customer.name,
        "Phone": customer.phone,
        "Address": customer.address,
        "Created At": new Date(customer.createdAt).toLocaleString()
      }));
      const customersSheet = XLSX.utils.json_to_sheet(customersData);
      XLSX.utils.book_append_sheet(wb, customersSheet, "Customers");

      // Products Sheet
      const productsData = products.map(product => ({
        "ID": product.id,
        "Name": product.name,
        "Rate": product.rate,
        "Category": product.category || "",
        "Created At": new Date(product.createdAt).toLocaleString()
      }));
      const productsSheet = XLSX.utils.json_to_sheet(productsData);
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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    setUploadFile(file);
    toast.success("File selected. Click 'Upload Data' to import.");
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          let salesCount = 0;
          let rentalCount = 0;
          let customersCount = 0;
          let productsCount = 0;

          // Import Sales Bills
          if (workbook.SheetNames.includes("Sales Bills")) {
            const salesSheet = workbook.Sheets["Sales Bills"];
            const salesData = XLSX.utils.sheet_to_json(salesSheet);
            
            salesData.forEach((row: any) => {
              try {
                db.saveSalesBill({
                  date: new Date(row["Date"]).toISOString(),
                  customerName: row["Customer Name"],
                  customerPhone: row["Customer Phone"],
                  customerAddress: row["Customer Address"] || "",
                  items: JSON.parse(row["Items"]),
                  subtotal: row["Subtotal"],
                  taxAmount: row["Tax Amount"],
                  taxType: row["Tax Type"],
                  advanceAmount: row["Advance Amount"],
                  totalAmount: row["Total Amount"],
                  isPaid: row["Is Paid"] === "Yes",
                  customerFeedback: row["Customer Feedback"] || undefined
                });
                salesCount++;
              } catch (err) {
                console.error("Error importing sales bill:", err);
              }
            });
          }

          // Import Rental Bills
          if (workbook.SheetNames.includes("Rental Bills")) {
            const rentalSheet = workbook.Sheets["Rental Bills"];
            const rentalData = XLSX.utils.sheet_to_json(rentalSheet);
            
            rentalData.forEach((row: any) => {
              try {
                db.saveRentalBill({
                  fromDate: new Date(row["From Date"]).toISOString(),
                  toDate: row["To Date"] ? new Date(row["To Date"]).toISOString() : undefined,
                  customerName: row["Customer Name"],
                  customerPhone: row["Customer Phone"],
                  customerAddress: row["Customer Address"] || "",
                  items: JSON.parse(row["Items"]),
                  subtotal: row["Subtotal"],
                  transportFees: row["Transport Fees"] || 0,
                  taxAmount: row["Tax Amount"],
                  taxType: row["Tax Type"],
                  advanceAmount: row["Advance Amount"],
                  totalAmount: row["Total Amount"],
                  isPaid: row["Is Paid"] === "Yes",
                  customerFeedback: row["Customer Feedback"] || undefined
                });
                rentalCount++;
              } catch (err) {
                console.error("Error importing rental bill:", err);
              }
            });
          }

          // Import Products
          if (workbook.SheetNames.includes("Products")) {
            const productsSheet = workbook.Sheets["Products"];
            const productsData = XLSX.utils.sheet_to_json(productsSheet);
            
            productsData.forEach((row: any) => {
              try {
                db.saveProduct({
                  name: row["Name"],
                  rate: row["Rate"],
                  category: row["Category"] || ""
                });
                productsCount++;
              } catch (err) {
                console.error("Error importing product:", err);
              }
            });
          }

          toast.success(
            `Import completed! Sales: ${salesCount}, Rental: ${rentalCount}, Products: ${productsCount}`,
            { duration: 5000 }
          );

          setUploadFile(null);
          setIsUploading(false);

          // Reload page to show new data
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error("Parse error:", error);
          toast.error("Failed to parse Excel file. Please check the format.");
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(uploadFile);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload data. Please try again.");
      setIsUploading(false);
    }
  };

  const salesBills = db.getSalesBills();
  const rentalBills = db.getRentalBills();
  const customers = db.getCustomers();
  const products = db.getProducts();

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Export & Import</h1>
          <p className="text-muted-foreground">
            Export your data for backup or import data from Excel files
          </p>
        </div>

        {/* Current Data Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sales Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{salesBills.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rental Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rentalBills.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total records</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Bulk Export All Data
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
                    <li>Can be re-imported later using the upload feature</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={exportToExcel} size="lg" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export All Data to Excel
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload Data from Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                    Important: Upload Guidelines
                  </p>
                  <ul className="list-disc list-inside text-orange-800 dark:text-orange-200 space-y-1">
                    <li>Upload only files exported from this system</li>
                    <li>Excel file must contain proper sheet names (Sales Bills, Rental Bills, etc.)</li>
                    <li>Imported data will be added to your existing records</li>
                    <li>Make sure to backup your current data before uploading</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label>Select Excel File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2 cursor-pointer"
                disabled={isUploading}
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: <span className="font-medium">{uploadFile.name}</span>
                </p>
              )}
            </div>

            <Button 
              onClick={handleBulkUpload} 
              size="lg" 
              className="w-full"
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-spin" />
                  Uploading Data...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Data from Excel
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
                <h4 className="font-semibold mb-2">📦 Backup & Restore</h4>
                <p className="text-sm text-muted-foreground">
                  Export your data regularly as a backup. If you need to restore or migrate to a new system, 
                  simply import the Excel file.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Data Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Use Excel's powerful features to analyze your sales trends, customer behavior, 
                  and product performance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🤖 ML & Predictions</h4>
                <p className="text-sm text-muted-foreground">
                  Export data to train machine learning models for sales forecasting, 
                  inventory optimization, and customer insights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔄 System Updates</h4>
                <p className="text-sm text-muted-foreground">
                  When updating the application, export your data first, then re-import after the update 
                  to preserve all records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
