"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, type CalendarBooking, type Customer } from "@/lib/database";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Trash2, CalendarPlus, Search, Clock } from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [formData, setFormData] = useState({
    billType: "sales" as "sales" | "rental",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
  });

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = db.searchCustomers(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const loadBookings = () => {
    setBookings(db.getBookings());
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
    });
    setSearchQuery(customer.name);
    setShowSearchResults(false);
  };

  const handleBooking = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!formData.customerName || !formData.customerPhone) {
      toast.error("Please enter customer name and phone");
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":");
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    db.saveBooking({
      date: bookingDateTime.toISOString(),
      billType: formData.billType,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      notes: formData.notes,
    });

    toast.success("Booking created successfully");
    setFormData({
      billType: "sales",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
    });
    setSearchQuery("");
    setSelectedTime("09:00");
    setIsDialogOpen(false);
    loadBookings();
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      db.deleteBooking(id);
      toast.success("Booking deleted");
      loadBookings();
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const modifiers = {
    booked: bookings.map(b => new Date(b.date)),
  };

  const modifiersStyles = {
    booked: { 
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      fontWeight: "bold",
    },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Calendar</CardTitle>
              <Button onClick={() => setIsDialogOpen(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Pre-Book
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>

        {/* Bookings for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarPlus className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bookings</h3>
                <p className="text-muted-foreground mb-4">
                  No pre-booked events for this date
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Create Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateBookings
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={booking.billType === "sales" ? "default" : "secondary"}>
                            {booking.billType === "sales" ? "Sales" : "Rental"}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(booking.date), "h:mm a")}
                          </div>
                        </div>
                        <div className="font-semibold text-lg">{booking.customerName}</div>
                        <div className="text-sm text-muted-foreground">{booking.customerPhone}</div>
                        {booking.notes && (
                          <div className="mt-2 text-sm p-2 bg-muted rounded">
                            {booking.notes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Upcoming Bookings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings scheduled
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant={booking.billType === "sales" ? "default" : "secondary"}>
                        {booking.billType === "sales" ? "Sales" : "Rental"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-semibold">{format(new Date(booking.date), "PPP")}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.date), "h:mm a")}
                    </div>
                    <div className="text-sm font-medium">{booking.customerName}</div>
                    <div className="text-sm text-muted-foreground">{booking.customerPhone}</div>
                    {booking.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Pre-Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Booking Date & Time</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg font-medium">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "No date selected"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Bill Type</Label>
              <Select
                value={formData.billType}
                onValueChange={(value: "sales" | "rental") => 
                  setFormData({ ...formData, billType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Billing</SelectItem>
                  <SelectItem value="rental">Rental Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Label>Search Customer</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or address"
                  className="pl-9"
                />
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      <div className="text-xs text-muted-foreground">{customer.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Customer Name *</Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <Label>Customer Phone *</Label>
              <Input
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label>Customer Address</Label>
              <Input
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or requirements"
                rows={3}
              />
            </div>

            <Button onClick={handleBooking} className="w-full">
              Create Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}