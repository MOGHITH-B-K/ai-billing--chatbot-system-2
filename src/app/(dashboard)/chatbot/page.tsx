"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  images?: string[];
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your real-time billing assistant. I can help you with:\n\n• Looking up customer information with photos\n• Finding bills by customer name or phone\n• Checking pending payments\n• Viewing sales and rental statistics\n• Product inventory status\n• Recent bookings\n• Navigating to different sections\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: "user" | "bot", content: string, images?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      images,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const processQuery = async (query: string) => {
    const lowerQuery = query.toLowerCase();
    setIsProcessing(true);

    try {
      // Customer search with photos
      if (lowerQuery.includes("customer") || lowerQuery.includes("find") || lowerQuery.includes("search")) {
        const response = await fetch('/api/customers?limit=100');
        if (!response.ok) throw new Error('Failed to fetch customers');
        
        const customers = await response.json();
        
        if (customers.length === 0) {
          return "No customers found in the database yet.";
        }
        
        // Extract potential search terms
        const words = query.split(" ");
        let results = customers;
        
        for (const word of words) {
          const matches = customers.filter((c: any) => 
            c.name.toLowerCase().includes(word.toLowerCase()) ||
            c.phone.includes(word)
          );
          if (matches.length > 0 && matches.length < results.length) {
            results = matches;
          }
        }

        if (results.length === 0) {
          return "No matching customers found. Try searching by name or phone number.";
        }

        // Fetch photos for matching customers
        let responseText = `Found ${results.length} customer(s):\n\n`;
        const customerImages: string[] = [];
        
        for (let i = 0; i < Math.min(results.length, 5); i++) {
          const customer = results[i];
          responseText += `${i + 1}. ${customer.name}\n   Phone: ${customer.phone}\n   Address: ${customer.address || 'N/A'}\n`;
          
          // Fetch customer photos
          try {
            const photosResponse = await fetch(`/api/customers/${customer.id}/photos`);
            if (photosResponse.ok) {
              const photosData = await photosResponse.json();
              if (photosData.photos && photosData.photos.length > 0) {
                responseText += `   📸 ${photosData.photos.length} photo(s) available\n`;
                customerImages.push(...photosData.photos);
              }
            }
          } catch (error) {
            console.error('Error fetching photos:', error);
          }
          
          responseText += '\n';
        }
        
        if (results.length > 5) {
          responseText += `\n...and ${results.length - 5} more`;
        }

        addMessage("bot", responseText, customerImages.length > 0 ? customerImages : undefined);
        return null;
      }

      // Pending payments
      if (lowerQuery.includes("pending") || lowerQuery.includes("due")) {
        const [salesResponse, rentalResponse] = await Promise.all([
          fetch('/api/sales-bills?limit=1000'),
          fetch('/api/rental-bills?limit=1000')
        ]);

        const salesBills = await salesResponse.json();
        const rentalBills = await rentalResponse.json();

        const salesPending = salesBills.filter((b: any) => !b.isPaid && b.advanceAmount === 0);
        const rentalPending = rentalBills.filter((b: any) => !b.isPaid && b.advanceAmount === 0);
        const totalPending = salesPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0) +
                            rentalPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0);

        return `Pending Payments Summary:\n\n• Sales: ${salesPending.length} bills - ₹${salesPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0).toFixed(2)}\n• Rental: ${rentalPending.length} bills - ₹${rentalPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0).toFixed(2)}\n• Total Pending: ₹${totalPending.toFixed(2)}\n\nYou can view detailed pending bills in the Pending section.`;
      }

      // Statistics
      if (lowerQuery.includes("stats") || lowerQuery.includes("statistics") || lowerQuery.includes("total") || lowerQuery.includes("revenue")) {
        const [salesResponse, rentalResponse] = await Promise.all([
          fetch('/api/sales-bills?limit=1000'),
          fetch('/api/rental-bills?limit=1000')
        ]);

        const salesBills = await salesResponse.json();
        const rentalBills = await rentalResponse.json();
        const salesTotal = salesBills.reduce((sum: number, b: any) => sum + (b.totalAmount + b.advanceAmount), 0);
        const rentalTotal = rentalBills.reduce((sum: number, b: any) => sum + (b.totalAmount + b.advanceAmount), 0);

        return `Business Statistics:\n\n📊 Sales:\n• Total Bills: ${salesBills.length}\n• Revenue: ₹${salesTotal.toFixed(2)}\n• Fully Paid: ${salesBills.filter((b: any) => b.isPaid).length}\n\n🏠 Rental:\n• Total Bills: ${rentalBills.length}\n• Revenue: ₹${rentalTotal.toFixed(2)}\n• Fully Paid: ${rentalBills.filter((b: any) => b.isPaid).length}\n\n💰 Total Revenue: ₹${(salesTotal + rentalTotal).toFixed(2)}`;
      }

      // Product inventory
      if (lowerQuery.includes("product") || lowerQuery.includes("stock") || lowerQuery.includes("inventory")) {
        const response = await fetch('/api/products?limit=1000');
        const products = await response.json();
        
        const lowStock = products.filter((p: any) => p.stockQuantity < p.minStockLevel);
        const outOfStock = products.filter((p: any) => p.stockQuantity === 0);

        let result = `Product Inventory Summary:\n\n📦 Total Products: ${products.length}\n`;
        
        if (outOfStock.length > 0) {
          result += `\n⚠️ OUT OF STOCK (${outOfStock.length}):\n`;
          outOfStock.slice(0, 5).forEach((p: any) => {
            result += `   • ${p.name}\n`;
          });
        }
        
        if (lowStock.length > 0) {
          result += `\n📉 LOW STOCK (${lowStock.length}):\n`;
          lowStock.slice(0, 5).forEach((p: any) => {
            result += `   • ${p.name}: ${p.stockQuantity}/${p.minStockLevel}\n`;
          });
        }
        
        if (lowStock.length === 0 && outOfStock.length === 0) {
          result += `\n✅ All products are well-stocked!`;
        }

        return result;
      }

      // Bookings
      if (lowerQuery.includes("booking") || lowerQuery.includes("booked")) {
        const response = await fetch('/api/bookings?limit=100');
        const bookings = await response.json();

        if (bookings.length === 0) {
          return "No bookings found in the system.";
        }

        return `Recent Bookings (Last 5):\n\n${bookings.slice(0, 5).map((b: any, i: number) => 
          `${i + 1}. ${b.customerName} - ${b.billType === 'sales' ? 'Sales' : 'Rental'}\n   Amount: ₹${b.totalAmount.toFixed(2)}\n   Status: ${b.status}\n   Date: ${format(new Date(b.bookingDate), 'PPP')}`
        ).join('\n\n')}`;
      }

      // Recent bills
      if (lowerQuery.includes("recent") || lowerQuery.includes("latest") || lowerQuery.includes("last")) {
        const [salesResponse, rentalResponse] = await Promise.all([
          fetch('/api/sales-bills?limit=10'),
          fetch('/api/rental-bills?limit=10')
        ]);

        const salesBills = await salesResponse.json();
        const rentalBills = await rentalResponse.json();
        
        const allBills = [
          ...salesBills.map((b: any) => ({ ...b, type: "Sales" })),
          ...rentalBills.map((b: any) => ({ ...b, type: "Rental" }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (allBills.length === 0) {
          return "No bills found in the database yet.";
        }

        return `Recent Bills (Last 5):\n\n${allBills.slice(0, 5).map((b: any, i: number) => 
          `${i + 1}. ${b.type} Bill #${b.serialNo}\n   Customer: ${b.customerName}\n   Amount: ₹${b.totalAmount.toFixed(2)}\n   Status: ${b.isPaid ? "Paid" : "Pending"}`
        ).join('\n\n')}`;
      }

      // Navigation help
      if (lowerQuery.includes("how") || lowerQuery.includes("where") || lowerQuery.includes("navigate")) {
        return `Navigation Guide:\n\n• Sales Billing - Create new sales bills\n• Rental Billing - Create rental bills with date ranges\n• Bookings - View and manage booked bills\n• Previous Records - View, edit, delete all past bills\n• Pending - See all unpaid bills\n• Advance - Track partial payments\n• Fully Paid - View completed transactions\n• Overall Sales - Business analytics and charts\n• Product Details - Manage product catalog\n• Customer Behavior - View customer feedback\n• Calendar - Pre-book appointments\n• Downloads - Export all bills\n\nUse the sidebar menu to navigate to any section!`;
      }

      // Default response
      return "I can help you with:\n\n• Searching for customers (with photos)\n• Checking pending payments\n• Viewing business statistics\n• Product inventory status\n• Recent bookings\n• Finding recent bills\n• Navigation assistance\n\nTry asking questions like:\n- 'Show me pending payments'\n- 'Find customer with phone 1234567890'\n- 'What are the recent bills?'\n- 'Show me total revenue'\n- 'Check product inventory'\n- 'Show recent bookings'";

    } catch (error) {
      console.error('Error processing query:', error);
      return "Sorry, I encountered an error while fetching data. Please try again.";
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userInput = input;
    addMessage("user", userInput);
    setInput("");
    
    const response = await processQuery(userInput);
    if (response) {
      addMessage("bot", response);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)]">
      <Toaster />
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Billing Assistant - Real-Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.type === "bot" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  
                  {/* Display customer photos */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {message.images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img} 
                            alt={`Customer photo ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(img, '_blank')}
                          />
                          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            <ImageIcon className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                      {message.images.length > 4 && (
                        <div className="col-span-2 text-center text-xs text-muted-foreground">
                          +{message.images.length - 4} more photo(s)
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`text-xs mt-2 ${
                      message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {format(message.timestamp, "p")}
                  </div>
                </div>
                {message.type === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your billing system..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button onClick={handleSend} size="icon" disabled={isProcessing}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Try: "Show pending payments", "Find customer", "Check inventory", "Recent bookings"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}