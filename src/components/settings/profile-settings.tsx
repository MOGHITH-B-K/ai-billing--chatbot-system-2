"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Store, Upload, X, QrCode, RotateCcw } from "lucide-react";
import Image from "next/image";

interface ShopProfile {
  shopName: string;
  address: string;
  phone1: string;
  phone2: string;
  logo: string | null;
  paymentQR: string | null;
}

const DEFAULT_PROFILE: ShopProfile = {
  shopName: "SREE SAI DURGA",
  address: "MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203",
  phone1: "9790548669",
  phone2: "9442378669",
  logo: null,
  paymentQR: null,
};

export function ProfileSettings() {
  const [profile, setProfile] = useState<ShopProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load from API first
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setProfile({
            shopName: data.shopName || DEFAULT_PROFILE.shopName,
            address: data.shopAddress || DEFAULT_PROFILE.address,
            phone1: data.phoneNumber1 || DEFAULT_PROFILE.phone1,
            phone2: data.phoneNumber2 || DEFAULT_PROFILE.phone2,
            logo: data.logoUrl || null,
            paymentQR: data.paymentQrUrl || null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  const handleImageUpload = (type: "logo" | "paymentQR", file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setProfile((prev) => ({
        ...prev,
        [type]: base64,
      }));
      toast.success(`${type === "logo" ? "Logo" : "Payment QR Code"} uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (type: "logo" | "paymentQR") => {
    setProfile((prev) => ({
      ...prev,
      [type]: null,
    }));
    toast.success(`${type === "logo" ? "Logo" : "Payment QR Code"} removed`);
  };

  const handleResetToDefault = async () => {
    setIsLoading(true);
    try {
      // Save default values to database
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: DEFAULT_PROFILE.shopName,
          shopAddress: DEFAULT_PROFILE.address,
          phoneNumber1: DEFAULT_PROFILE.phone1,
          phoneNumber2: DEFAULT_PROFILE.phone2,
          logoUrl: null,
          paymentQrUrl: null
        })
      });

      if (response.ok) {
        setProfile(DEFAULT_PROFILE);
        toast.success("Shop profile reset to default values");
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error("Failed to reset shop profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: profile.shopName,
          shopAddress: profile.address,
          phoneNumber1: profile.phone1,
          phoneNumber2: profile.phone2,
          logoUrl: profile.logo,
          paymentQrUrl: profile.paymentQR
        })
      });

      if (response.ok) {
        toast.success("Profile settings saved successfully");
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save profile settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <CardTitle>Shop Profile Settings</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetToDefault} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
        <CardDescription>Update your shop information and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shop Name */}
        <div className="space-y-2">
          <Label htmlFor="shopName">Shop Name</Label>
          <Input
            id="shopName"
            value={profile.shopName}
            onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
            placeholder="Enter shop name"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            placeholder="Enter shop address"
            rows={3}
          />
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone1">Phone Number 1</Label>
            <Input
              id="phone1"
              value={profile.phone1}
              onChange={(e) => setProfile({ ...profile, phone1: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone2">Phone Number 2</Label>
            <Input
              id="phone2"
              value={profile.phone2}
              onChange={(e) => setProfile({ ...profile, phone2: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Shop Logo</Label>
          <div className="flex items-center gap-4">
            {profile.logo ? (
              <div className="relative">
                <Image
                  src={profile.logo}
                  alt="Shop Logo"
                  width={100}
                  height={100}
                  className="rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => handleRemoveImage("logo")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-[100px] h-[100px] border-2 border-dashed rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("logo", file);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload your shop logo (recommended size: 200x200px)
              </p>
            </div>
          </div>
        </div>

        {/* Payment QR Code Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Payment QR Code (G-Pay/UPI)
          </Label>
          <div className="flex items-center gap-4">
            {profile.paymentQR ? (
              <div className="relative">
                <Image
                  src={profile.paymentQR}
                  alt="Payment QR Code"
                  width={150}
                  height={150}
                  className="rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => handleRemoveImage("paymentQR")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-[150px] h-[150px] border-2 border-dashed rounded-lg flex items-center justify-center">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("paymentQR", file);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload your UPI/G-Pay QR code. This will appear on all printed bills.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Profile Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}