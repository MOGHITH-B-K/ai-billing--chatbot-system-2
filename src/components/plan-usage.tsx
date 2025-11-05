"use client";

import { useCustomer } from "autumn-js/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PlanUsageIndicator() {
  const { customer, isLoading } = useCustomer();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const planName = customer?.products?.at(-1)?.name || "Free";
  const features = customer?.features || {};

  const featureList = Object.values(features);

  if (featureList.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Plan & Usage</CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border">
            <Zap className="h-3 w-3" />
            {planName}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureList.map((feature: any) => {
          const hasLimit = typeof feature.included_usage === 'number';
          const usage = feature.usage || 0;
          const limit = feature.included_usage || 0;
          const percentage = hasLimit && limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;
          const isNearLimit = percentage > 80;
          const isAtLimit = percentage >= 100;

          return (
            <div key={feature.feature_id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">
                    {feature.feature_id === 'monthly_bills' && 'Monthly Bills'}
                    {feature.feature_id === 'customer_records' && 'Customer Records'}
                    {feature.feature_id === 'product_catalog' && 'Product Catalog'}
                  </p>
                  {feature.interval && (
                    <p className="text-xs text-muted-foreground">
                      Resets {new Date(feature.next_reset_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-mono font-medium",
                    isAtLimit && "text-destructive",
                    isNearLimit && !isAtLimit && "text-yellow-600 dark:text-yellow-500"
                  )}>
                    {usage.toLocaleString()}
                    {hasLimit && ` / ${limit.toLocaleString()}`}
                  </p>
                  {!hasLimit && (
                    <p className="text-xs text-muted-foreground">Unlimited</p>
                  )}
                </div>
              </div>

              {hasLimit && (
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2",
                    isAtLimit && "[&>div]:bg-destructive",
                    isNearLimit && !isAtLimit && "[&>div]:bg-yellow-500"
                  )}
                />
              )}

              {isAtLimit && (
                <p className="text-xs text-destructive">
                  ⚠️ Limit reached. Upgrade to continue.
                </p>
              )}
            </div>
          );
        })}

        <Button asChild className="w-full mt-4" variant="outline">
          <Link href="/pricing">
            Manage Plan
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
