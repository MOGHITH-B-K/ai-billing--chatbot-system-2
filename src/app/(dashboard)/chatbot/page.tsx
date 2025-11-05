"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your billing assistant. I can help you with:\n\n• Looking up customer information\n• Finding bills by customer name or phone\n• Checking pending payments\n• Viewing sales and rental statistics\n• Navigating to different sections\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: "user" | "bot", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const processQuery = async (query: string) => {
    const lowerQuery = query.toLowerCase();
    const token = localStorage.getItem("bearer_token");

    try {
      // Customer search
      if (lowerQuery.includes("customer") || lowerQuery.includes("find") || lowerQuery.includes("search")) {
        const response = await fetch("/api/customers", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) return "Unable to fetch customer data. Please try again.";
        
        const data = await response.json();
        const customers = data.customers || [];
        
        if (customers.length === 0) {
          return "No customers found in the database yet.";
        }
        
        // Extract potential phone or name from query
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

        return `Found ${results.length} customer(s):\n\n${results.slice(0, 5).map((c: any, i: number) => 
          `${i + 1}. ${c.name}\n   Phone: ${c.phone}\n   Address: ${c.address || 'N/A'}`
        ).join("\n\n")}${results.length > 5 ? "\n\n...and more" : ""}`;
      }

      // Pending payments
      if (lowerQuery.includes("pending") || lowerQuery.includes("due")) {
        const [salesRes, rentalRes] = await Promise.all([
          fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (!salesRes.ok || !rentalRes.ok) {
          return "Unable to fetch bill data. Please try again.";
        }

        const salesData = await salesRes.json();
        const rentalData = await rentalRes.json();
        
        const salesPending = (salesData.bills || []).filter((b: any) => !b.isPaid && b.advanceAmount === 0);
        const rentalPending = (rentalData.bills || []).filter((b: any) => !b.isPaid && b.advanceAmount === 0);
        const totalPending = salesPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0) +
                            rentalPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0);

        return `Pending Payments Summary:\n\n• Sales: ${salesPending.length} bills - ₹${salesPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0).toFixed(2)}\n• Rental: ${rentalPending.length} bills - ₹${rentalPending.reduce((sum: number, b: any) => sum + b.totalAmount, 0).toFixed(2)}\n• Total Pending: ₹${totalPending.toFixed(2)}\n\nYou can view detailed pending bills in the Pending section.`;
      }

      // Statistics
      if (lowerQuery.includes("stats") || lowerQuery.includes("statistics") || lowerQuery.includes("total") || lowerQuery.includes("revenue")) {
        const [salesRes, rentalRes] = await Promise.all([
          fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (!salesRes.ok || !rentalRes.ok) {
          return "Unable to fetch statistics. Please try again.";
        }

        const salesData = await salesRes.json();
        const rentalData = await rentalRes.json();
        
        const salesBills = salesData.bills || [];
        const rentalBills = rentalData.bills || [];
        const salesTotal = salesBills.reduce((sum: number, b: any) => sum + (b.totalAmount + b.advanceAmount), 0);
        const rentalTotal = rentalBills.reduce((sum: number, b: any) => sum + (b.totalAmount + b.advanceAmount), 0);

        return `Business Statistics:\n\n📊 Sales:\n• Total Bills: ${salesBills.length}\n• Revenue: ₹${salesTotal.toFixed(2)}\n• Fully Paid: ${salesBills.filter((b: any) => b.isPaid).length}\n\n🏠 Rental:\n• Total Bills: ${rentalBills.length}\n• Revenue: ₹${rentalTotal.toFixed(2)}\n• Fully Paid: ${rentalBills.filter((b: any) => b.isPaid).length}\n\n💰 Total Revenue: ₹${(salesTotal + rentalTotal).toFixed(2)}`;
      }

      // Recent bills
      if (lowerQuery.includes("recent") || lowerQuery.includes("latest") || lowerQuery.includes("last")) {
        const [salesRes, rentalRes] = await Promise.all([
          fetch("/api/sales-bills", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("/api/rental-bills", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (!salesRes.ok || !rentalRes.ok) {
          return "Unable to fetch recent bills. Please try again.";
        }

        const salesData = await salesRes.json();
        const rentalData = await rentalRes.json();
        
        const allBills = [
          ...(salesData.bills || []).map((b: any) => ({ ...b, type: "Sales" })),
          ...(rentalData.bills || []).map((b: any) => ({ ...b, type: "Rental" }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (allBills.length === 0) {
          return "No bills found in the database yet.";
        }

        return `Recent Bills (Last 5):\n\n${allBills.slice(0, 5).map((b: any, i: number) => 
          `${i + 1}. ${b.type} Bill #${b.serialNo}\n   Customer: ${b.customerName}\n   Amount: ₹${b.totalAmount.toFixed(2)}\n   Status: ${b.isPaid ? "Paid" : "Pending"}`
        ).join("\n\n")}`;
      }

      // Navigation help
      if (lowerQuery.includes("how") || lowerQuery.includes("where") || lowerQuery.includes("navigate")) {
        return `Navigation Guide:\n\n• Sales Billing - Create new sales bills\n• Rental Billing - Create rental bills with date ranges\n• Previous Records - View, edit, delete all past bills\n• Pending - See all unpaid bills\n• Advance - Track partial payments\n• Fully Paid - View completed transactions\n• Overall Sales - Business analytics and charts\n• Product Details - Manage product catalog\n• Customer Behavior - View customer feedback\n• Calendar - Pre-book appointments\n• Downloads - Export all bills\n\nUse the sidebar menu to navigate to any section!`;
      }

      // Default response
      return "I can help you with:\n\n• Searching for customers\n• Checking pending payments\n• Viewing business statistics\n• Finding recent bills\n• Navigation assistance\n\nTry asking questions like:\n- 'Show me pending payments'\n- 'Find customer with phone 1234567890'\n- 'What are the recent bills?'\n- 'Show me total revenue'\n- 'How do I create a sales bill?'";
    } catch (error) {
      console.error("Error processing query:", error);
      return "I encountered an error processing your request. Please try again.";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    addMessage("user", input);
    
    setTimeout(async () => {
      const response = await processQuery(input);
      addMessage("bot", response);
    }, 500);

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Billing Assistant
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
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Try: "Show pending payments", "Find customer", "Recent bills"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}