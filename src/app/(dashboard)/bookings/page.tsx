"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Trash2, Edit, Eye, Calendar as CalendarIcon, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: number;
  billType: string;
  billId: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: any[];
  totalAmount: number;
  bookingDate: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    billType: "sales",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    items: [{ itemName: "", qty: 1, rate: 0, amount: 0 }],
    totalAmount: 0,
    bookingDate: new Date(),
    notes: "",
    status: "booked",
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("shop_auth_token");
    if (!token) {
      router.push("/login?redirect=/bookings");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  // Fetch bookings
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(query) ||
          booking.customerPhone.includes(query)
      );
    }

    // Bill type filter
    if (billTypeFilter !== "all") {
      filtered = filtered.filter((booking) => booking.billType === billTypeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter((booking) => {
        const bookingDate = format(new Date(booking.bookingDate), "yyyy-MM-dd");
        return bookingDate === filterDate;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, billTypeFilter, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings?limit=100");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        setFilteredBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    }
  };

  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewDialog(true);
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditNotes(booking.notes || "");
    setEditStatus(booking.status);
    setShowEditDialog(true);
  };

  const handleDelete = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteDialog(true);
  };

  const confirmEdit = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/bookings?id=${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: editNotes,
          status: editStatus,
        }),
      });

      if (response.ok) {
        toast.success("Booking updated successfully");
        setShowEditDialog(false);
        fetchBookings();
      } else {
        throw new Error("Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const confirmDelete = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/bookings?id=${selectedBooking.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Booking deleted successfully");
        setShowDeleteDialog(false);
        fetchBookings();
      } else {
        throw new Error("Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const handleDeleteAll = () => {
    if (filteredBookings.length === 0) {
      toast.error("No bookings to delete");
      return;
    }
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = async () => {
    try {
      let url = "/api/bookings?bulkDelete=true";

      if (selectedIds.length > 0) {
        // Delete selected bookings
        url += `&ids=${selectedIds.join(",")}`;
      } else {
        // Delete all filtered bookings
        if (billTypeFilter !== "all") url += `&billType=${billTypeFilter}`;
        if (statusFilter !== "all") url += `&status=${statusFilter}`;
        if (dateFilter) {
          const filterDate = format(dateFilter, "yyyy-MM-dd");
          url += `&startDate=${filterDate}&endDate=${filterDate}`;
        }
      }

      const response = await fetch(url, { method: "DELETE" });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowDeleteAllDialog(false);
        setSelectedIds([]);
        fetchBookings();
      } else {
        throw new Error("Failed to delete bookings");
      }
    } catch (error) {
      console.error("Error deleting bookings:", error);
      toast.error("Failed to delete bookings");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setBillTypeFilter("all");
    setStatusFilter("all");
    setDateFilter(undefined);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map((b) => b.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      booked: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getBillTypeBadge = (billType: string) => {
    return (
      <Badge variant={billType === "sales" ? "default" : "secondary"}>
        {billType === "sales" ? "Sales" : "Rental"}
      </Badge>
    );
  };

  const handleAddBooking = () => {
    setNewBooking({
      billType: "sales",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      items: [{ itemName: "", qty: 1, rate: 0, amount: 0 }],
      totalAmount: 0,
      bookingDate: new Date(),
      notes: "",
      status: "booked",
    });
    setShowAddDialog(true);
  };

  const addItem = () => {
    setNewBooking({
      ...newBooking,
      items: [...newBooking.items, { itemName: "", qty: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (newBooking.items.length > 1) {
      const updatedItems = newBooking.items.filter((_, i) => i !== index);
      setNewBooking({ ...newBooking, items: updatedItems });
      calculateTotal(updatedItems);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newBooking.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate amount for this item
    if (field === "qty" || field === "rate") {
      updatedItems[index].amount = updatedItems[index].qty * updatedItems[index].rate;
    }
    
    setNewBooking({ ...newBooking, items: updatedItems });
    calculateTotal(updatedItems);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    setNewBooking((prev) => ({ ...prev, totalAmount: total }));
  };

  const confirmAddBooking = async () => {
    // Validation
    if (!newBooking.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!newBooking.customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }
    if (newBooking.items.some((item) => !item.itemName.trim())) {
      toast.error("All items must have a name");
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billType: newBooking.billType,
          billId: 0, // Placeholder - adjust as needed
          customerName: newBooking.customerName,
          customerPhone: newBooking.customerPhone,
          customerAddress: newBooking.customerAddress,
          items: newBooking.items,
          totalAmount: newBooking.totalAmount,
          bookingDate: newBooking.bookingDate.toISOString(),
          notes: newBooking.notes,
          status: newBooking.status,
        }),
      });

      if (response.ok) {
        toast.success("Booking added successfully");
        setShowAddDialog(false);
        fetchBookings();
      } else {
        throw new Error("Failed to add booking");
      }
    } catch (error) {
      console.error("Error adding booking:", error);
      toast.error("Failed to add booking");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Bookings</CardTitle>
          <Button onClick={handleAddBooking}>
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Bill Type</Label>
              <Select value={billTypeFilter} onValueChange={setBillTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateFilter ? format(dateFilter, "PPP") : "Filter by Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => {
                    setDateFilter(date);
                    setShowDateFilter(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter(undefined)}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Date
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>

            <div className="ml-auto flex gap-2">
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Filtered
              </Button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredBookings.length > 0 &&
                        selectedIds.length === filteredBookings.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(booking.id)}
                          onCheckedChange={() => toggleSelect(booking.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{booking.customerName}</TableCell>
                      <TableCell>{booking.customerPhone}</TableCell>
                      <TableCell>{getBillTypeBadge(booking.billType)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>₹{booking.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(booking.bookingDate), "PPP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(booking)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </CardContent>
      </Card>

      {/* Add Booking Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Type</Label>
                <Select
                  value={newBooking.billType}
                  onValueChange={(value) =>
                    setNewBooking({ ...newBooking, billType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={newBooking.status}
                  onValueChange={(value) =>
                    setNewBooking({ ...newBooking, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={newBooking.customerName}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, customerName: e.target.value })
                  }
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label>Customer Phone *</Label>
                <Input
                  value={newBooking.customerPhone}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, customerPhone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label>Customer Address</Label>
              <Input
                value={newBooking.customerAddress}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, customerAddress: e.target.value })
                }
                placeholder="Enter customer address"
              />
            </div>

            <div>
              <Label>Booking Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newBooking.bookingDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newBooking.bookingDate}
                    onSelect={(date) =>
                      date && setNewBooking({ ...newBooking, bookingDate: date })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items *</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3 border rounded-lg p-4">
                {newBooking.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Item Name</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) =>
                          updateItem(index, "itemName", e.target.value)
                        }
                        placeholder="Item name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", parseFloat(e.target.value) || 0)
                        }
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Rate</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value) || 0)
                        }
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Amount</Label>
                      <Input value={item.amount.toFixed(2)} disabled />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        disabled={newBooking.items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">
                ₹{newBooking.totalAmount.toFixed(2)}
              </span>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={newBooking.notes}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddBooking}>Add Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <p className="font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bill Type</Label>
                  <div className="mt-1">{getBillTypeBadge(selectedBooking.billType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium text-lg">₹{selectedBooking.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Booking Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.bookingDate), "PPP")}
                  </p>
                </div>
              </div>

              {selectedBooking.customerAddress && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedBooking.customerAddress}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Items</Label>
                <div className="mt-2 border rounded-lg p-4 space-y-2">
                  {selectedBooking.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.itemName} (x{item.qty})
                      </span>
                      <span className="font-medium">₹{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bookings</DialogTitle>
            <DialogDescription>
              {selectedIds.length > 0
                ? `Are you sure you want to delete ${selectedIds.length} selected booking(s)?`
                : `Are you sure you want to delete all ${filteredBookings.length} filtered booking(s)?`}
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAll}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}