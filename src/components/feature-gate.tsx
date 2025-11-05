"use client";

import { useCustomer } from "autumn-js/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Crown, Loader2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({ 
  featureId, 
  children, 
  fallback,
  showUpgrade = true 
}: FeatureGateProps) {
  const { check, isLoading } = useCustomer();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        setChecking(true);
        try {
          const { data } = await check({ featureId });
          setAllowed(data?.allowed || false);
        } catch (error) {
          console.error("Feature check error:", error);
          setAllowed(false);
        } finally {
          setChecking(false);
        }
      }
    };
    checkAccess();
  }, [featureId, check, isLoading]);

  if (isLoading || checking || allowed === null) {
    return <Skeleton className="w-full h-20" />;
  }

  if (!allowed) {
    return <>{fallback || (showUpgrade && <UpgradePrompt featureId={featureId} />)}</>;
  }

  return <>{children}</>;
}

function UpgradePrompt({ featureId }: { featureId: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const featureNames: Record<string, string> = {
    monthly_bills: "Monthly Bills",
    customer_records: "Customer Records",
    product_catalog: "Product Catalog",
    customer_behavior_analytics: "Customer Behavior Analytics",
    advanced_reports: "Advanced Reports",
    priority_support: "Priority Support",
    api_access: "API Access"
  };

  const handleUpgrade = () => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
    } else {
      router.push('/pricing');
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Upgrade Required</CardTitle>
            <CardDescription>
              {featureNames[featureId] || "This feature"} is not available on your current plan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUpgrade} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}

interface UsageLimitWarningProps {
  featureId: string;
  usage: number;
  limit: number;
}

export function UsageLimitWarning({ featureId, usage, limit }: UsageLimitWarningProps) {
  const router = useRouter();
  const percentage = (usage / limit) * 100;

  if (percentage < 80) {
    return null;
  }

  const isAtLimit = percentage >= 100;

  return (
    <Card className={isAtLimit ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-500/5"}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 flex-shrink-0 ${isAtLimit ? "text-destructive" : "text-yellow-600"}`} />
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              {isAtLimit ? "Limit Reached" : "Approaching Limit"}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {isAtLimit 
                ? `You've used all ${limit} of your ${featureId.replace(/_/g, ' ')}. Upgrade to continue.`
                : `You've used ${usage} of ${limit} ${featureId.replace(/_/g, ' ')} (${percentage.toFixed(0)}%).`
              }
            </p>
            <Button 
              size="sm" 
              variant={isAtLimit ? "destructive" : "outline"}
              onClick={() => router.push('/pricing')}
            >
              <Crown className="h-3 w-3 mr-2" />
              {isAtLimit ? "Upgrade Now" : "View Plans"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
