"use client";

import { useCustomer } from "autumn-js/react";
import { useSession } from "@/lib/auth-client";
import { Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function PlanBadge({ className }: { className?: string }) {
  const { data: session } = useSession();
  const { customer, isLoading } = useCustomer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show anything if not mounted or no session
  if (!mounted || !session) {
    return null;
  }

  // Show default plan after 3 seconds if still loading
  if (isLoading) {
    return (
      <Link 
        href="/pricing" 
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 bg-muted text-muted-foreground border",
          className
        )}
      >
        <span className="whitespace-nowrap">Free Plan</span>
      </Link>
    );
  }

  const currentPlan = customer?.products?.at(-1);
  const planName = currentPlan?.name || "Free";
  const isPro = planName === "Pro";
  const isEnterprise = planName === "Enterprise";

  return (
    <Link 
      href="/pricing" 
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
        isPro && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        isEnterprise && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        !isPro && !isEnterprise && "bg-muted text-muted-foreground border",
        className
      )}
    >
      {(isPro || isEnterprise) && <Crown className="h-3 w-3" />}
      <span className="whitespace-nowrap">{planName} Plan</span>
    </Link>
  );
}