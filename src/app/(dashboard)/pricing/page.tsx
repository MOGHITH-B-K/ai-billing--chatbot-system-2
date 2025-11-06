"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    description: "Perfect for small shops getting started with digital billing",
    price: "Free",
    features: [
      "50 bills per month",
      "100 customer records",
      "50 products",
      "Basic reports",
      "Sales & Rental billing",
      "Customer management",
      "Product catalog"
    ]
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "For growing shops with more transactions and advanced needs",
    price: "₹999/month",
    recommended: true,
    features: [
      "500 bills per month",
      "1,000 customer records",
      "500 products",
      "Customer Behavior Analytics",
      "Advanced Reports",
      "Priority email support",
      "All Free features"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "For large shops with unlimited transactions and premium features",
    price: "₹2,499/month",
    features: [
      "Unlimited bills",
      "Unlimited customers",
      "Unlimited products",
      "Customer Behavior Analytics",
      "Advanced Reports",
      "Priority Support",
      "API Access",
      "All Pro features"
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your shop. Contact us to upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.recommended ? "border-primary shadow-lg" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.recommended && (
                  <Badge variant="default">Most Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="text-3xl font-bold">{plan.price}</div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" variant={plan.recommended ? "default" : "outline"}>
                {plan.id === "free" ? "Current Plan" : "Contact Us"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plans Include</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Sales & Rental billing",
              "Customer management",
              "Product catalog",
              "Calendar & booking system",
              "Previous records & search",
              "Download & print bills",
              "Secure cloud storage",
              "Mobile responsive design"
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Need help choosing? Contact us at 9790548669 or 9442378669</p>
      </div>
    </div>
  );
}