"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Database, FileText, Users, Package, Calendar, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StorageData {
  records: {
    salesBills: number;
    rentalBills: number;
    products: number;
    customers: number;
    bookings: number;
    total: number;
  };
  storage: {
    usedKB: number;
    usedMB: number;
    usedGB: number;
    maxGB: number;
    availableGB: number;
    usedPercentage: number;
  };
  breakdown: {
    salesBills: { count: number; sizeKB: number };
    rentalBills: { count: number; sizeKB: number };
    products: { count: number; sizeKB: number };
    customers: { count: number; sizeKB: number };
    bookings: { count: number; sizeKB: number };
  };
}

export default function StoragePage() {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      const response = await fetch('/api/storage');
      if (response.ok) {
        const data = await response.json();
        setStorageData(data);
      }
    } catch (error) {
      console.error('Error fetching storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium">Loading storage data...</div>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return (
      <div className="text-center py-12">
        <div className="text-xl font-semibold">Failed to load storage data</div>
      </div>
    );
  }

  const getStorageColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <HardDrive className="h-10 w-10" />
            Storage Management
          </h1>
          <p className="text-white/90">Monitor your database storage and record counts</p>
        </div>
      </div>

      {/* Overall Storage Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="h-6 w-6" />
            Overall Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {storageData.storage.usedGB.toFixed(3)} GB
              </div>
              <div className="text-sm text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {storageData.storage.availableGB.toFixed(3)} GB
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {storageData.storage.maxGB} GB
              </div>
              <div className="text-sm text-muted-foreground">Total Capacity</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                storageData.storage.usedPercentage < 50 ? 'text-green-600 dark:text-green-400' :
                storageData.storage.usedPercentage < 80 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {storageData.storage.usedPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Usage</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Storage Progress</span>
              <span className="text-muted-foreground">
                {storageData.storage.usedMB.toFixed(2)} MB / {(storageData.storage.maxGB * 1024).toFixed(0)} MB
              </span>
            </div>
            <Progress 
              value={storageData.storage.usedPercentage} 
              className="h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Record Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Sales Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {storageData.breakdown.salesBills.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {storageData.breakdown.salesBills.sizeKB.toFixed(2)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Rental Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {storageData.breakdown.rentalBills.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {storageData.breakdown.rentalBills.sizeKB.toFixed(2)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {storageData.breakdown.products.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {storageData.breakdown.products.sizeKB.toFixed(2)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {storageData.breakdown.customers.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {storageData.breakdown.customers.sizeKB.toFixed(2)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {storageData.breakdown.bookings.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {storageData.breakdown.bookings.sizeKB.toFixed(2)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold mb-2">
              {storageData.records.total.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              All database records
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Tips */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <CardTitle className="text-xl">💡 Storage Management Tips</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span>Regularly delete old bills and records you no longer need</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span>Export important data as PDF backups before deletion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span>Archive old customer records that are no longer active</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span>Current storage limit: 10 GB (free tier)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}