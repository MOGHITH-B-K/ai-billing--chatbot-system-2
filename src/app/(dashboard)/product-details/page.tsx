"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Search, Loader2, TrendingUp, AlertTriangle, Download, PackagePlus, History, Bell, X, Upload, Minus, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchWithCache, dataCache, debounce } from "@/lib/cache-utils";

interface Product {
  id: number;
  name: string;
  rate: number;
  category?: string;
  productType: string;
  stockQuantity: number;
  minStockLevel: number;
  totalSales: number;
  totalRentals: number;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

interface StockHistory {
  id: number;
  productId: number;
  productName: string;
  changeType: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  createdAt: string;
}

interface Analytics {
  totalProducts: number;
  salesProducts: number;
  rentalProducts: number;
  totalSalesCount: number;
  totalRentalsCount: number;
  topSellingProducts: Product[];
  topRentedProducts: Product[];
  lowStockCount: number;
  outOfStockCount: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export default function ProductDetailsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  
  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    rate: 0,
    category: "",
    productType: "sales",
    stockQuantity: 0,
    minStockLevel: 5,
  });
  const [stockChangeMode, setStockChangeMode] = useState<'increase' | 'decrease'>('increase');
  const [restockData, setRestockData] = useState({
    quantityChange: 0,
    changeType: "",
    notes: "",
  });

  // Optimized data loading with cache
  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchWithCache<Product[]>('/api/products?limit=1000', {}, 30000); // 30 second cache
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to direct fetch if cache fails
      const response = await fetch('/api/products?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchWithCache<Analytics>('/api/products/analytics', {}, 60000); // 1 minute cache
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      const response = await fetch('/api/products/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    }
  }, []);

  const loadLowStock = useCallback(async () => {
    try {
      const data = await fetchWithCache<Product[]>('/api/products/low-stock', {}, 20000); // 20 second cache
      setLowStockProducts(data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
      const response = await fetch('/api/products/low-stock');
      if (response.ok) {
        const data = await response.json();
        setLowStockProducts(data);
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load products first for immediate UI
      await loadProducts();
      // Load analytics and low stock in parallel
      await Promise.all([loadAnalytics(), loadLowStock()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadAnalytics, loadLowStock]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Show toast notification for low stock products
    if (lowStockProducts.length > 0 && !loading) {
      const outOfStock = lowStockProducts.filter(p => p.stockQuantity === 0).length;
      const lowStock = lowStockProducts.length - outOfStock;
      
      if (outOfStock > 0) {
        toast.error(`⚠️ ${outOfStock} product(s) are OUT OF STOCK!`, {
          duration: 10000,
          action: {
            label: "View",
            onClick: () => setActiveTab("low-stock")
          }
        });
      } else if (lowStock > 0) {
        toast.warning(`📦 ${lowStock} product(s) have low stock levels`, {
          duration: 8000,
          action: {
            label: "View",
            onClick: () => setActiveTab("low-stock")
          }
        });
      }
    }
  }, [lowStockProducts, loading]);

  const loadStockHistory = useCallback(async (productId?: number) => {
    try {
      const url = productId 
        ? `/api/products/stock-history?productId=${productId}&limit=50`
        : `/api/products/stock-history?limit=50`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStockHistory(data);
      }
    } catch (error) {
      console.error('Error fetching stock history:', error);
    }
  }, []);

  // Memoize filtered products with optimized filtering
  const filteredProducts = useMemo(() => {
    if (!searchQuery && activeTab === "all") return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query));
      
      if (activeTab === "all") return matchesSearch;
      if (activeTab === "sales") return matchesSearch && product.productType === "sales";
      if (activeTab === "rental") return matchesSearch && product.productType === "rental";
      if (activeTab === "low-stock") return matchesSearch && product.stockQuantity < product.minStockLevel;
      return matchesSearch;
    });
  }, [products, searchQuery, activeTab]);

  // Debounced search to prevent too many re-renders
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const fileContent = await uploadFile.text();
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
        toast.error("Invalid file format. Expected an array of products.");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const product of data) {
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: product.name,
              rate: product.rate || 0,
              category: product.category || undefined,
              productType: product.productType || "sales",
              stockQuantity: product.stockQuantity || 0,
              minStockLevel: product.minStockLevel || 5,
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error uploading product:', error);
        }
      }

      toast.success(`Uploaded ${successCount} products successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      setIsUploadOpen(false);
      setUploadFile(null);
      loadData();
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please ensure it is valid JSON.');
    }
  };

  const handleAdd = useCallback(async () => {
    if (!formData.name) {
      toast.error("Please enter product name");
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rate: formData.rate,
          category: formData.category || undefined,
          productType: formData.productType,
          stockQuantity: formData.stockQuantity,
          minStockLevel: formData.minStockLevel,
        })
      });

      if (response.ok) {
        toast.success("Product added successfully");
        setFormData({ name: "", rate: 0, category: "", productType: "sales", stockQuantity: 0, minStockLevel: 5 });
        setIsAddOpen(false);
        
        // Invalidate caches
        dataCache.clear('products');
        await loadData();
      } else {
        throw new Error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  }, [formData, loadData]);

  const handleEdit = useCallback(async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products?id=${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rate: formData.rate,
          category: formData.category || undefined,
          productType: formData.productType,
          stockQuantity: formData.stockQuantity,
          minStockLevel: formData.minStockLevel,
        })
      });

      if (response.ok) {
        toast.success("Product updated successfully");
        setIsEditOpen(false);
        setEditingProduct(null);
        setFormData({ name: "", rate: 0, category: "", productType: "sales", stockQuantity: 0, minStockLevel: 5 });
        
        // Invalidate caches
        dataCache.clear('products');
        await loadData();
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  }, [editingProduct, formData, loadData]);

  const handleRestock = useCallback(async () => {
    if (!restockingProduct || restockData.quantityChange === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const finalQuantityChange = stockChangeMode === 'decrease' 
      ? -Math.abs(restockData.quantityChange) 
      : Math.abs(restockData.quantityChange);

    if (stockChangeMode === 'decrease' && restockingProduct.stockQuantity + finalQuantityChange < 0) {
      toast.error(`Cannot decrease stock below 0. Current stock: ${restockingProduct.stockQuantity}`);
      return;
    }

    try {
      const response = await fetch('/api/products/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: restockingProduct.id,
          quantityChange: finalQuantityChange,
          changeType: restockData.changeType || (stockChangeMode === 'increase' ? 'restock' : 'adjustment'),
          notes: restockData.notes,
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Stock ${stockChangeMode === 'increase' ? 'increased' : 'decreased'} successfully`);
        setIsRestockOpen(false);
        setRestockingProduct(null);
        setRestockData({ quantityChange: 0, changeType: "", notes: "" });
        setStockChangeMode('increase');
        
        // Invalidate caches
        dataCache.clear('products');
        await loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
    }
  }, [restockingProduct, restockData, stockChangeMode, loadData]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        
        // Invalidate caches
        dataCache.clear('products');
        await loadData();
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  }, [loadData]);

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      rate: product.rate,
      category: product.category || "",
      productType: product.productType,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
    });
    setIsEditOpen(true);
  };

  const openRestock = (product: Product) => {
    setRestockingProduct(product);
    setRestockData({ quantityChange: 0, changeType: "", notes: "" });
    setStockChangeMode('increase');
    setIsRestockOpen(true);
  };

  const openHistory = (product?: Product) => {
    loadStockHistory(product?.id);
    setIsHistoryOpen(true);
  };

  const exportProducts = async () => {
    try {
      const response = await fetch('/api/products/export');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Products exported successfully");
      } else {
        throw new Error('Failed to export');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export products');
    }
  };

  const getStockStatus = useCallback((product: Product) => {
    if (product.stockQuantity === 0) return { label: "Out of Stock", color: "destructive" };
    if (product.stockQuantity < product.minStockLevel) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto space-y-6">
      <Toaster />
      
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && showLowStockAlert && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500 text-white p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 dark:text-red-100 text-lg mb-1">
                    Stock Alert: Immediate Action Required!
                  </h3>
                  <p className="text-red-800 dark:text-red-200 mb-3">
                    {lowStockProducts.filter(p => p.stockQuantity === 0).length > 0 && (
                      <span className="font-semibold">
                        {lowStockProducts.filter(p => p.stockQuantity === 0).length} product(s) OUT OF STOCK
                      </span>
                    )}
                    {lowStockProducts.filter(p => p.stockQuantity === 0).length > 0 && 
                     lowStockProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity < p.minStockLevel).length > 0 && " • "}
                    {lowStockProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity < p.minStockLevel).length > 0 && (
                      <span>
                        {lowStockProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity < p.minStockLevel).length} product(s) below minimum level
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.slice(0, 5).map(product => (
                      <Badge key={product.id} variant="destructive" className="text-xs">
                        {product.name}: {product.stockQuantity}/{product.minStockLevel}
                      </Badge>
                    ))}
                    {lowStockProducts.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{lowStockProducts.length - 5} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab("low-stock")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      View All Low Stock Items
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLowStockAlert(false)}
                className="text-red-900 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sales: {analytics.salesProducts} | Rental: {analytics.rentalProducts}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analytics.totalSalesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Items sold</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rentals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analytics.totalRentalsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Items rented</p>
            </CardContent>
          </Card>
          
          <Card className={analytics.lowStockCount > 0 ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Stock Alerts
                {analytics.lowStockCount > 0 && (
                  <span className="animate-pulse">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div className="text-3xl font-bold text-orange-600">{analytics.lowStockCount}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of stock: <span className="font-bold text-red-600">{analytics.outOfStockCount}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Graphs */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topSellingProducts.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalSales" fill="#10b981" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Rented Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Rented Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topRentedProducts.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalRentals" fill="#3b82f6" name="Rentals" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Product Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sales Products', value: analytics.salesProducts },
                      { name: 'Rental Products', value: analytics.rentalProducts },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stock Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'In Stock', value: analytics.totalProducts - analytics.lowStockCount },
                      { name: 'Low Stock', value: analytics.lowStockCount - analytics.outOfStockCount },
                      { name: 'Out of Stock', value: analytics.outOfStockCount },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <CardTitle className="text-2xl">Product Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openHistory()}>
                <History className="h-4 w-4 mr-2" />
                Stock History
              </Button>
              <Button variant="outline" onClick={exportProducts}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Product Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a JSON file with product data. Expected format:
                      </p>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`[
  {
    "name": "Product Name",
    "rate": 100,
    "category": "Category",
    "productType": "sales",
    "stockQuantity": 50,
    "minStockLevel": 10
  }
]`}
                      </pre>
                    </div>
                    <div>
                      <Label>Select JSON File</Label>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                    </div>
                    {uploadFile && (
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                        <p className="text-sm font-medium">
                          Selected: {uploadFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {(uploadFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
                    <Button onClick={handleUpload} className="w-full" disabled={!uploadFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Products
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Product Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label>Product Type *</Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      >
                        <option value="sales">Sales</option>
                        <option value="rental">Rental</option>
                      </select>
                    </div>
                    <div>
                      <Label>Rate (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter rate"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Enter category (optional)"
                      />
                    </div>
                    <div>
                      <Label>Initial Stock Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                        placeholder="Enter initial stock"
                      />
                    </div>
                    <div>
                      <Label>Minimum Stock Level (Alert Threshold)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 5 })}
                        placeholder="Enter minimum stock level"
                      />
                    </div>
                    <Button onClick={handleAdd} className="w-full">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="rental">Rental</TabsTrigger>
                <TabsTrigger value="low-stock" className={lowStockProducts.length > 0 ? "data-[state=active]:bg-red-500 data-[state=active]:text-white" : ""}>
                  <Bell className="h-4 w-4 mr-1" />
                  Low Stock
                  {lowStockProducts.length > 0 && (
                    <Badge variant="destructive" className="ml-2 animate-pulse">
                      {lowStockProducts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  defaultValue={searchQuery}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No products found" : "No Products Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try a different search term" : "Start by adding your first product"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsAddOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rate (₹)</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Min Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Rentals</TableHead>
                        <TableHead>Last Restocked</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const status = getStockStatus(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <Badge variant={product.productType === 'sales' ? 'default' : 'secondary'}>
                                {product.productType}
                              </Badge>
                            </TableCell>
                            <TableCell>₹{product.rate.toFixed(2)}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell className="font-semibold">{product.stockQuantity}</TableCell>
                            <TableCell>{product.minStockLevel}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  status.color === "destructive" ? "destructive" : 
                                  status.color === "warning" ? "secondary" : 
                                  "default"
                                }
                                className={status.color === "warning" ? "bg-orange-500 text-white" : ""}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{product.totalSales}</TableCell>
                            <TableCell>{product.totalRentals}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {product.lastRestocked 
                                ? new Date(product.lastRestocked).toLocaleDateString()
                                : "Never"
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openRestock(product)}
                                  title="Restock"
                                >
                                  <PackagePlus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEdit(product)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(product.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label>Product Type *</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              >
                <option value="sales">Sales</option>
                <option value="rental">Rental</option>
              </select>
            </div>
            <div>
              <Label>Rate (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                placeholder="Enter rate"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter category (optional)"
              />
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                placeholder="Enter stock quantity"
              />
            </div>
            <div>
              <Label>Minimum Stock Level</Label>
              <Input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 5 })}
                placeholder="Enter minimum stock level"
              />
            </div>
            <Button onClick={handleEdit} className="w-full">
              Update Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Adjust Stock Level
            </DialogTitle>
          </DialogHeader>
          {restockingProduct && (
            <div className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-lg">{restockingProduct.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Stock: <span className="font-bold text-lg">{restockingProduct.stockQuantity}</span>
                </p>
                {restockingProduct.stockQuantity < restockingProduct.minStockLevel && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Below minimum level ({restockingProduct.minStockLevel})
                  </Badge>
                )}
              </div>

              {/* Stock Change Mode Selector */}
              <div>
                <Label className="mb-2 block">Operation Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={stockChangeMode === 'increase' ? 'default' : 'outline'}
                    onClick={() => setStockChangeMode('increase')}
                    className={stockChangeMode === 'increase' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Increase Stock
                  </Button>
                  <Button
                    type="button"
                    variant={stockChangeMode === 'decrease' ? 'default' : 'outline'}
                    onClick={() => setStockChangeMode('decrease')}
                    className={stockChangeMode === 'decrease' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Decrease Stock
                  </Button>
                </div>
              </div>

              <div>
                <Label>Quantity {stockChangeMode === 'increase' ? 'to Add' : 'to Remove'} *</Label>
                <Input
                  type="number"
                  min="1"
                  value={restockData.quantityChange}
                  onChange={(e) => setRestockData({ ...restockData, quantityChange: parseInt(e.target.value) || 0 })}
                  placeholder={`Enter quantity to ${stockChangeMode}`}
                  className="mt-2"
                />
                {stockChangeMode === 'decrease' && restockData.quantityChange > restockingProduct.stockQuantity && (
                  <p className="text-red-600 text-sm mt-1">
                    ⚠️ Cannot remove more than current stock ({restockingProduct.stockQuantity})
                  </p>
                )}
              </div>

              <div>
                <Label>Change Type</Label>
                <select
                  className="w-full border rounded-md p-2 mt-2"
                  value={restockData.changeType}
                  onChange={(e) => setRestockData({ ...restockData, changeType: e.target.value })}
                >
                  <option value="">{stockChangeMode === 'increase' ? 'Restock' : 'Adjustment'} (Default)</option>
                  <option value="restock">Restock (Incoming Supply)</option>
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="sale">Sold via Bill</option>
                  <option value="rental">Rental Transaction</option>
                  <option value="return">Customer Return</option>
                  <option value="damage">Damaged/Lost</option>
                  <option value="inventory">Inventory Check</option>
                </select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={restockData.notes}
                  onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                  placeholder={`Add notes about this ${stockChangeMode}`}
                  className="mt-2"
                />
              </div>

              {restockData.quantityChange > 0 && (
                <div className={`p-3 rounded-lg ${
                  stockChangeMode === 'increase' 
                    ? 'bg-green-50 dark:bg-green-950' 
                    : 'bg-red-50 dark:bg-red-950'
                }`}>
                  <p className="text-sm font-medium flex items-center justify-between">
                    <span>New Stock Level:</span>
                    <span className={`text-lg font-bold ${
                      stockChangeMode === 'increase' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {restockingProduct.stockQuantity} 
                      <span className="mx-2">→</span>
                      {stockChangeMode === 'increase' 
                        ? restockingProduct.stockQuantity + restockData.quantityChange
                        : restockingProduct.stockQuantity - restockData.quantityChange
                      }
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stockChangeMode === 'increase' ? '+' : '-'}{restockData.quantityChange} units
                  </p>
                </div>
              )}

              <Button 
                onClick={handleRestock} 
                className={`w-full ${
                  stockChangeMode === 'increase' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={restockData.quantityChange <= 0 || 
                  (stockChangeMode === 'decrease' && restockData.quantityChange > restockingProduct.stockQuantity)}
              >
                {stockChangeMode === 'increase' ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Increase Stock
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 mr-2" />
                    Decrease Stock
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Stock Change History</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {stockHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No stock history found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell className="text-xs">
                        {new Date(history.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{history.productName}</TableCell>
                      <TableCell>
                        <Badge variant={history.changeType === 'restock' ? 'default' : 'secondary'}>
                          {history.changeType}
                        </Badge>
                      </TableCell>
                      <TableCell className={history.quantityChange > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {history.quantityChange > 0 ? '+' : ''}{history.quantityChange}
                      </TableCell>
                      <TableCell>{history.previousQuantity}</TableCell>
                      <TableCell className="font-semibold">{history.newQuantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {history.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}