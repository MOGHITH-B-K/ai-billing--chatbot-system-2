"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { PricingTable } from "@/components/autumn/pricing-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const productDetails = [
  {
    id: "free",
    description: "Perfect for small shops getting started with digital billing",
    items: [
      {
        featureId: "monthly_bills",
        primaryText: "50 bills per month",
        secondaryText: "Sales + Rental combined"
      },
      {
        featureId: "customer_records",
        primaryText: "100 customer records",
        secondaryText: "Store and manage customer data"
      },
      {
        featureId: "product_catalog",
        primaryText: "50 products",
        secondaryText: "Manage your product inventory"
      },
      {
        primaryText: "Basic reports",
        secondaryText: "Essential billing reports"
      }
    ]
  },
  {
    id: "pro",
    description: "For growing shops with more transactions and advanced needs",
    recommendText: "Most Popular",
    price: {
      primaryText: "₹999/month",
      secondaryText: "billed monthly"
    },
    items: [
      {
        featureId: "monthly_bills",
        primaryText: "500 bills per month",
        secondaryText: "10x more billing capacity"
      },
      {
        featureId: "customer_records",
        primaryText: "1,000 customer records",
        secondaryText: "10x more customer storage"
      },
      {
        featureId: "product_catalog",
        primaryText: "500 products",
        secondaryText: "10x larger product catalog"
      },
      {
        featureId: "customer_behavior_analytics",
        primaryText: "Customer Behavior Analytics",
        secondaryText: "Track customer feedback and trends"
      },
      {
        featureId: "advanced_reports",
        primaryText: "Advanced Reports",
        secondaryText: "Detailed analytics and insights"
      },
      {
        primaryText: "Priority email support",
        secondaryText: "Get help faster"
      }
    ]
  },
  {
    id: "enterprise",
    description: "For large shops with unlimited transactions and premium features",
    price: {
      primaryText: "₹2,499/month",
      secondaryText: "billed monthly"
    },
    items: [
      {
        primaryText: "Unlimited bills",
        secondaryText: "No limits on billing"
      },
      {
        primaryText: "Unlimited customers",
        secondaryText: "No limits on customer records"
      },
      {
        primaryText: "Unlimited products",
        secondaryText: "No limits on product catalog"
      },
      {
        featureId: "customer_behavior_analytics",
        primaryText: "Customer Behavior Analytics",
        secondaryText: "Track customer feedback and trends"
      },
      {
        featureId: "advanced_reports",
        primaryText: "Advanced Reports",
        secondaryText: "Detailed analytics and insights"
      },
      {
        featureId: "priority_support",
        primaryText: "Priority Support",
        secondaryText: "Get help via phone and email"
      },
      {
        featureId: "api_access",
        primaryText: "API Access",
        secondaryText: "Integrate with other systems"
      }
    ]
  }
];

export default function PricingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session && window.location.search.includes('plan=')) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [session, isPending, router]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your shop. Upgrade or downgrade anytime.
        </p>
      </div>

      <PricingTable productDetails={productDetails} />

      <Card className="mt-12">
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
