"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save, Printer, Search, Share2, Percent } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";

interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

interface Product {
  id: number;
  name: string;
  rate: number;
  category?: string;
  productType: string;
  stockQuantity?: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
}

interface ShopSettings {
  shopName?: string;
  shopAddress?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  logoUrl?: string;
  paymentQrUrl?: string;
}

export default function SalesBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serialNo, setSerialNo] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<BillItem[]>([{ itemName: "", qty: 1, rate: 0, amount: 0 }]);
  const [useTaxPercentage, setUseTaxPercentage] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxType, setTaxType] = useState("GST");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState<'very_good' | 'good' | 'bad' | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState<{ [key: number]: Product[] }>({});
  const [showProductSearch, setShowProductSearch] = useState<{ [key: number]: boolean }>({});
  const [shopSettings, setShopSettings] = useState<ShopSettings>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);

  // Memoized calculation functions for better performance
  const calculateSubtotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [items]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const tax = Number(taxAmount) || 0;
    const advance = Number(advanceAmount) || 0;
    return subtotal + tax - advance;
  }, [calculateSubtotal, taxAmount, advanceAmount]);

  // Memoize calculated values to prevent unnecessary recalculations
  const subtotal = useMemo(() => calculateSubtotal(), [calculateSubtotal]);
  const total = useMemo(() => calculateTotal(), [calculateTotal]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("shop_auth_token");
    if (!token) {
      router.push("/login?redirect=/sales-billing");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  // Load bill for editing if edit parameter exists
  useEffect(() => {
    if (isAuthenticated) {
      const editId = searchParams?.get("edit");
      if (editId) {
        loadBillForEdit(editId);
      } else {
        fetchNextSerial();
      }
      fetchShopSettings();
    }
  }, [isAuthenticated, searchParams]);

  const loadBillForEdit = async (editId: string) => {
    try {
      const billData = localStorage.getItem("edit_sales_bill");
      if (billData) {
        const bill = JSON.parse(billData);
        
        // Populate form with bill data - ensure all numbers are valid
        setEditingBillId(bill.id);
        setSerialNo(Number(bill.serialNo) || 1);
        setDate(new Date(bill.billDate));
        setCustomerName(bill.customerName);
        setCustomerPhone(bill.customerPhone);
        setCustomerAddress(bill.customerAddress || "");
        setItems(bill.items.map((item: BillItem) => ({
          ...item,
          qty: Number(item.qty) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0
        })));
        setTaxPercentage(Number(bill.taxPercentage) || 0);
        setTaxAmount(Number(bill.taxAmount) || 0);
        setTaxType(bill.taxType || "GST");
        setAdvanceAmount(Number(bill.advanceAmount) || 0);
        setIsPaid(bill.isPaid);
        setCustomerFeedback(bill.customerFeedback);
        
        // Clear the localStorage item
        localStorage.removeItem("edit_sales_bill");
        
        toast.info(`Editing Bill #${bill.serialNo}`);
      }
    } catch (error) {
      console.error('Error loading bill for edit:', error);
      toast.error('Failed to load bill for editing');
      fetchNextSerial();
    }
  };

  // Auto-calculate tax based on percentage or keep manual amount
  useEffect(() => {
    if (useTaxPercentage) {
      const subtotalValue = calculateSubtotal();
      const taxPercentageValue = Number(taxPercentage) || 0;
      const calculatedTax = (subtotalValue * taxPercentageValue) / 100;
      setTaxAmount(Number(calculatedTax.toFixed(2)));
    }
  }, [useTaxPercentage, taxPercentage, calculateSubtotal]);

  const fetchNextSerial = async () => {
    try {
      const response = await fetch('/api/sales-bills/next-serial');
      if (response.ok) {
        const data = await response.json();
        setSerialNo(data.nextSerial);
      }
    } catch (error) {
      console.error('Error fetching next serial:', error);
      toast.error('Failed to fetch serial number');
    }
  };

  const fetchShopSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setShopSettings(data);
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  // Search customers with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/customers?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setShowSearch(data.length > 0);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const searchProducts = async (query: string, index: number) => {
    if (!query.trim()) {
      setProductSearchResults(prev => ({ ...prev, [index]: [] }));
      setShowProductSearch(prev => ({ ...prev, [index]: false }));
      return;
    }

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&productType=sales`);
      if (response.ok) {
        const data = await response.json();
        setProductSearchResults(prev => ({ ...prev, [index]: data }));
        setShowProductSearch(prev => ({ ...prev, [index]: data.length > 0 }));
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];
    
    // Ensure numeric values are valid
    if (field === 'qty' || field === 'rate') {
      const numValue = Number(value) || 0;
      newItems[index] = { ...newItems[index], [field]: numValue };
      newItems[index].amount = Number((newItems[index].qty * newItems[index].rate).toFixed(2));
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    if (field === 'itemName' && typeof value === 'string') {
      searchProducts(value, index);
    }
    
    setItems(newItems);
  };

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...items];
    const rate = Number(product.rate) || 0;
    const qty = Number(newItems[index].qty) || 1;
    
    newItems[index] = {
      ...newItems[index],
      itemName: product.name,
      rate: rate,
      amount: Number((qty * rate).toFixed(2))
    };
    setItems(newItems);
    setShowProductSearch(prev => ({ ...prev, [index]: false }));
  };

  const addItem = () => {
    setItems([...items, { itemName: "", qty: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address || "");
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleSave = async () => {
    if (!customerName || !customerPhone) {
      toast.error("Please enter customer name and phone number");
      return;
    }

    if (items.some(item => !item.itemName)) {
      toast.error("Please fill all item names");
      return;
    }

    setIsSaving(true);

    try {
      // Save customer first
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          address: customerAddress
        })
      });

      const billData = {
        billDate: date.toISOString(),
        customerName,
        customerPhone,
        customerAddress,
        items: items.map(item => ({
          itemName: item.itemName,
          qty: Number(item.qty) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0
        })),
        subtotal: Number(subtotal.toFixed(2)),
        taxPercentage: Number(taxPercentage) || 0,
        taxAmount: Number(taxAmount) || 0,
        taxType,
        advanceAmount: Number(advanceAmount) || 0,
        totalAmount: Number(total.toFixed(2)),
        isPaid,
        customerFeedback,
        shopName: shopSettings.shopName || 'SREE SAI DURGA',
        shopAddress: shopSettings.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203',
        shopPhone1: shopSettings.phoneNumber1 || '9790548669',
        shopPhone2: shopSettings.phoneNumber2 || '9442378669',
        shopLogoUrl: shopSettings.logoUrl,
        shopQrUrl: shopSettings.paymentQrUrl
      };

      let response;
      if (editingBillId) {
        // Update existing bill
        response = await fetch(`/api/sales-bills?id=${editingBillId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData)
        });
      } else {
        // Create new bill
        response = await fetch('/api/sales-bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save bill');
      }

      const savedBill = await response.json();
      toast.success(`Bill #${savedBill.serialNo} ${editingBillId ? 'updated' : 'saved'} successfully!`);
      
      // Clear edit state and navigate back
      if (editingBillId) {
        setEditingBillId(null);
        // Force refresh by adding timestamp to URL
        setTimeout(() => {
          router.push('/previous-records?refresh=' + Date.now());
        }, 500);
        return;
      }
      
      // Reset form only if creating new bill
      await fetchNextSerial();
      setDate(new Date());
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setItems([{ itemName: "", qty: 1, rate: 0, amount: 0 }]);
      setTaxPercentage(18);
      setTaxAmount(0);
      setAdvanceAmount(0);
      setIsPaid(false);
      setCustomerFeedback(undefined);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Bill #${serialNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .logo { max-width: 150px; height: auto; margin-bottom: 10px; }
            .shop-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .shop-details { font-size: 12px; margin-top: 5px; line-height: 1.6; }
            .bill-info { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .total-section { margin-top: 20px; float: right; width: 350px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row.final { font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; font-size: 18px; }
            .footer { margin-top: 60px; text-align: center; clear: both; }
            .qr-code { max-width: 200px; height: auto; margin: 10px auto; }
            .payment-info { font-size: 12px; margin-top: 10px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${shopSettings.logoUrl ? `<img src="${shopSettings.logoUrl}" alt="Shop Logo" class="logo" />` : ''}
            <div class="shop-name">${shopSettings.shopName || 'SREE SAI DURGA'}</div>
            <div class="shop-details">
              SHOP ADDRESS: ${shopSettings.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203'}<br>
              CALL: ${shopSettings.phoneNumber1 || '9790548669'}${shopSettings.phoneNumber2 ? `, ${shopSettings.phoneNumber2}` : ', 9442378669'}
            </div>
          </div>
          
          <div class="bill-info">
            <strong>Bill No:</strong> ${serialNo} &nbsp;&nbsp;&nbsp; <strong>Date:</strong> ${format(date, 'PPP p')}
          </div>
          
          <div class="bill-info">
            <strong>Customer Name:</strong> ${customerName}<br>
            <strong>Phone:</strong> ${customerPhone}<br>
            ${customerAddress ? `<strong>Address:</strong> ${customerAddress}` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item Name</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.itemName}</td>
                  <td class="text-right">${Number(item.qty) || 0}</td>
                  <td class="text-right">₹${(Number(item.rate) || 0).toFixed(2)}</td>
                  <td class="text-right">₹${(Number(item.amount) || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${taxType} @ ${Number(taxPercentage) || 0}%):</span>
              <span>₹${(Number(taxAmount) || 0).toFixed(2)}</span>
            </div>
            ${advanceAmount > 0 ? `
            <div class="total-row">
              <span>Advance:</span>
              <span>-₹${(Number(advanceAmount) || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Payment Status:</span>
              <span><strong>${isPaid ? '✅ FULLY PAID' : '⏳ PENDING'}</strong></span>
            </div>
          </div>
          
          ${shopSettings.paymentQrUrl ? `
          <div class="footer">
            <div class="payment-info"><strong>Scan to Pay:</strong></div>
            <img src="${shopSettings.paymentQrUrl}" alt="Payment QR Code" class="qr-code" />
          </div>
          ` : ''}
          
          <div style="clear: both; margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleWhatsAppShare = () => {
    if (!customerName || !customerPhone) {
      toast.error("Please enter customer details first");
      return;
    }

    const message = `*${shopSettings.shopName || 'SREE SAI DURGA'}*
SHOP ADDRESS: ${shopSettings.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203'}
CALL: ${shopSettings.phoneNumber1 || '9790548669'}${shopSettings.phoneNumber2 ? `, ${shopSettings.phoneNumber2}` : ', 9442378669'}

━━━━━━━━━━━━━━━━━━━━
*SALES BILL #${serialNo}*
━━━━━━━━━━━━━━━━━━━━

📅 Date: ${format(date, 'PPP p')}

*Customer Details:*
👤 Name: ${customerName}
📱 Phone: ${customerPhone}
${customerAddress ? `📍 Address: ${customerAddress}` : ''}

*Items:*
${items.map((item, index) => 
  `${index + 1}. ${item.itemName}
   Qty: ${Number(item.qty) || 0} × ₹${(Number(item.rate) || 0).toFixed(2)} = ₹${(Number(item.amount) || 0).toFixed(2)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━
*Bill Summary:*
Subtotal: ₹${subtotal.toFixed(2)}
Tax (${taxType} @ ${Number(taxPercentage) || 0}%): ₹${(Number(taxAmount) || 0).toFixed(2)}
${advanceAmount > 0 ? `Advance: -₹${(Number(advanceAmount) || 0).toFixed(2)}` : ''}
━━━━━━━━━━━━━━━━━━━━
*Total Amount: ₹${total.toFixed(2)}*

Payment Status: ${isPaid ? '✅ FULLY PAID' : '⏳ PENDING'}

Thank you for your business! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {editingBillId ? `Edit Sales Bill #${serialNo}` : 'Sales Billing'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Label>Search Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {showSearch && (
              <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
                <CardContent className="p-2">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-accent cursor-pointer rounded-md"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      {customer.address && <div className="text-sm text-muted-foreground">{customer.address}</div>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Serial No and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Serial No</Label>
              <Input value={serialNo} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP p")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={format(date, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(date);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setDate(newDate);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label>Customer Phone *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label>Customer Address</Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg">Items</Label>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                      <Label>Item Name</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        placeholder="Enter or search item name"
                      />
                      {showProductSearch[index] && productSearchResults[index]?.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-auto">
                          <CardContent className="p-2">
                            {productSearchResults[index].map((product) => (
                              <div
                                key={product.id}
                                className="p-2 hover:bg-accent cursor-pointer rounded-md"
                                onClick={() => handleProductSelect(index, product)}
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">₹{product.rate.toFixed(2)}</div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Rate (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Amount (₹)</Label>
                      <div className="flex gap-2">
                        <Input value={item.amount.toFixed(2)} disabled className="bg-muted" />
                        {items.length > 1 && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Total Calculation */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Tax Type</Label>
                    <Input
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value)}
                      placeholder="GST / VAT / Other"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-background p-3 rounded-md">
                    <Switch
                      id="tax-mode"
                      checked={useTaxPercentage}
                      onCheckedChange={setUseTaxPercentage}
                    />
                    <Label htmlFor="tax-mode" className="cursor-pointer">
                      {useTaxPercentage ? 'Using Percentage' : 'Manual Amount'}
                    </Label>
                    <Percent className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  {useTaxPercentage ? (
                    <div>
                      <Label>Tax Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxPercentage}
                        onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Tax Amount: ₹{taxAmount.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label>Tax Amount (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Advance Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPaid"
                      checked={isPaid}
                      onCheckedChange={(checked) => setIsPaid(checked as boolean)}
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium cursor-pointer">
                      Fully Paid
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({taxPercentage}%):</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance:</span>
                    <span>-₹{advanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Feedback */}
          <div>
            <Label className="mb-3 block">Customer Feedback (Not printed)</Label>
            <div className="flex gap-4">
              <Button
                variant={customerFeedback === 'very_good' ? 'default' : 'outline'}
                onClick={() => setCustomerFeedback('very_good')}
                className="text-2xl"
              >
                😊 Very Good
              </Button>
              <Button
                variant={customerFeedback === 'good' ? 'default' : 'outline'}
                onClick={() => setCustomerFeedback('good')}
                className="text-2xl"
              >
                🙂 Good
              </Button>
              <Button
                variant={customerFeedback === 'bad' ? 'default' : 'outline'}
                onClick={() => setCustomerFeedback('bad')}
                className="text-2xl"
              >
                😞 Bad
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end flex-wrap">
            {editingBillId && (
              <Button 
                onClick={() => {
                  setEditingBillId(null);
                  router.push('/sales-billing');
                }} 
                variant="outline" 
                size="lg"
              >
                Cancel Edit
              </Button>
            )}
            <Button onClick={handleSave} size="lg" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : editingBillId ? 'Update Bill' : 'Save Bill'}
            </Button>
            <Button onClick={handlePrint} variant="outline" size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            <Button onClick={handleWhatsAppShare} variant="outline" size="lg" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
              <Share2 className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}