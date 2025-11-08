"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Loader2, Sparkles, ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Initialize default credentials on mount
  useEffect(() => {
    const savedAdmins = localStorage.getItem("shop_admins");
    const savedPasswords = localStorage.getItem("shop_admin_passwords");

    if (!savedAdmins) {
      const defaultAdmin = [{ id: "1", username: "MOGHITH" }];
      localStorage.setItem("shop_admins", JSON.stringify(defaultAdmin));
    }

    if (!savedPasswords) {
      const defaultPasswords = { "MOGHITH": "289236173476" };
      localStorage.setItem("shop_admin_passwords", JSON.stringify(defaultPasswords));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check against saved admin credentials from settings
      const savedAdmins = JSON.parse(localStorage.getItem("shop_admins") || "[]");
      const savedPasswords = JSON.parse(localStorage.getItem("shop_admin_passwords") || "{}");

      // Find matching admin
      const admin = savedAdmins.find((a: any) => a.username === formData.username);
      
      if (!admin) {
        toast.error("Invalid username or password!");
        setIsLoading(false);
        return;
      }

      // Check password
      const savedPassword = savedPasswords[formData.username];
      if (savedPassword !== formData.password) {
        toast.error("Invalid username or password!");
        setIsLoading(false);
        return;
      }

      // Generate token and save
      const token = `shop_${Date.now()}_${Math.random().toString(36)}`;
      localStorage.setItem("shop_auth_token", token);
      localStorage.setItem("shop_user", admin.username);

      toast.success(`Welcome back, ${admin.username}! 🎉`);
      
      const redirect = searchParams?.get("redirect") || "/sales-billing";
      router.push(redirect);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20}%`,
              width: `${20 + Math.random() * 80}px`,
              height: `${20 + Math.random() * 80}px`,
              background: `radial-gradient(circle at 30% 30%, 
                ${['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)', 'rgba(99, 102, 241, 0.3)'][i % 3]},
                ${['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)', 'rgba(99, 102, 241, 0.1)'][i % 3]})`,
              border: `1px solid ${['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)', 'rgba(99, 102, 241, 0.2)'][i % 3]}`,
              boxShadow: `0 8px 32px 0 ${['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.15)', 'rgba(99, 102, 241, 0.15)'][i % 3]}`,
              backdropFilter: 'blur(4px)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header with Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-5 rounded-2xl shadow-lg">
                <Store className="h-10 w-10" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SREE SAI DURGA
              </h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Shop Billing System
                <Sparkles className="h-4 w-4" />
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 pl-4 bg-background/50 backdrop-blur border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="off"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 pl-4 bg-background/50 backdrop-blur border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Sign In to Dashboard
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-1 text-xs text-muted-foreground bg-card/60 backdrop-blur-lg rounded-xl p-4 border border-primary/10">
          <p className="font-semibold text-sm">📍 MAIN ROAD, THIRUVENNAI NALLUR</p>
          <p>VILLUPURAM Dt, PINCODE: 607203</p>
          <p className="flex items-center justify-center gap-2 mt-2">
            <span>📞 9790548669</span>
            <span>•</span>
            <span>9442378669</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-bubble {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
            transform: scale(1);
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120vh) translateX(${Math.random() * 200 - 100}px) scale(0.8);
            opacity: 0;
          }
        }

        .animate-float-bubble {
          animation: float-bubble linear infinite;
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-2xl">
            <Store className="h-12 w-12 animate-pulse" />
          </div>
        </div>
        <div className="text-lg font-medium">Loading...</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}