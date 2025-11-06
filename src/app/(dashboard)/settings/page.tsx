"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Globe, UserPlus, Palette, Upload, Store, CreditCard, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("English");
  const [mounted, setMounted] = useState(false);
  
  // Admin Management
  const [admins, setAdmins] = useState<Array<{ id: string; username: string }>>([]);
  const [addAdminDialog, setAddAdminDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", confirmPassword: "" });
  
  // Delete confirmation dialog
  const [deleteAdminDialog, setDeleteAdminDialog] = useState<{ id: string; username: string } | null>(null);
  
  // Change password dialog
  const [changePasswordDialog, setChangePasswordDialog] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  // Shop Profile
  const [shopProfile, setShopProfile] = useState({
    name: "SREE SAI DURGA",
    address: "MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE: 607203",
    phone1: "9790548669",
    phone2: "9442378669",
    logo: "",
    paymentQRCode: ""
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [qrPreview, setQrPreview] = useState("");

  useEffect(() => {
    setMounted(true);
    // Load settings from localStorage
    const savedLanguage = localStorage.getItem("shop_language");
    if (savedLanguage) setLanguage(savedLanguage);

    const savedProfile = localStorage.getItem("shop_profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setShopProfile(profile);
      setLogoPreview(profile.logo || "");
      setQrPreview(profile.paymentQRCode || "");
    }

    const savedAdmins = localStorage.getItem("shop_admins");
    const savedPasswords = localStorage.getItem("shop_admin_passwords");
    
    if (savedAdmins) {
      setAdmins(JSON.parse(savedAdmins));
    } else {
      // Initialize with default admin
      const defaultAdmin = [{ id: "1", username: "MOGHITH" }];
      setAdmins(defaultAdmin);
      localStorage.setItem("shop_admins", JSON.stringify(defaultAdmin));
    }
    
    // Initialize default password if not set
    if (!savedPasswords) {
      const defaultPasswords = { "MOGHITH": "289236173476" };
      localStorage.setItem("shop_admin_passwords", JSON.stringify(defaultPasswords));
      toast.info("Default credentials set: Username: MOGHITH, Password: 289236173476");
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("shop_language", lang);
    toast.success(`Language changed to ${lang}`, {
      description: "Full translation support coming soon!"
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleAddAdmin = () => {
    if (!newAdmin.username || !newAdmin.password) {
      toast.error("Please enter username and password");
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (admins.some(admin => admin.username === newAdmin.username)) {
      toast.error("Username already exists");
      return;
    }

    const adminData = {
      id: Date.now().toString(),
      username: newAdmin.username
    };

    // Save encrypted password separately (in real app, this should be hashed)
    const passwords = JSON.parse(localStorage.getItem("shop_admin_passwords") || "{}");
    passwords[newAdmin.username] = newAdmin.password;
    localStorage.setItem("shop_admin_passwords", JSON.stringify(passwords));

    const updatedAdmins = [...admins, adminData];
    setAdmins(updatedAdmins);
    localStorage.setItem("shop_admins", JSON.stringify(updatedAdmins));

    toast.success("Admin added successfully");
    setAddAdminDialog(false);
    setNewAdmin({ username: "", password: "", confirmPassword: "" });
  };

  const handleDeleteAdmin = (id: string, username: string) => {
    if (username === "MOGHITH") {
      toast.error("Cannot delete main admin");
      return;
    }
    setDeleteAdminDialog({ id, username });
  };

  const confirmDeleteAdmin = () => {
    if (!deleteAdminDialog) return;
    
    const { id, username } = deleteAdminDialog;
    const updatedAdmins = admins.filter(admin => admin.id !== id);
    setAdmins(updatedAdmins);
    localStorage.setItem("shop_admins", JSON.stringify(updatedAdmins));

    // Remove password
    const passwords = JSON.parse(localStorage.getItem("shop_admin_passwords") || "{}");
    delete passwords[username];
    localStorage.setItem("shop_admin_passwords", JSON.stringify(passwords));

    toast.success("Admin deleted successfully");
    setDeleteAdminDialog(null);
  };

  const handleChangePassword = (username: string) => {
    setChangePasswordDialog(username);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
  };

  const confirmChangePassword = () => {
    if (!changePasswordDialog) return;
    
    if (!passwordForm.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const passwords = JSON.parse(localStorage.getItem("shop_admin_passwords") || "{}");
    passwords[changePasswordDialog] = passwordForm.newPassword;
    localStorage.setItem("shop_admin_passwords", JSON.stringify(passwords));
    toast.success(`Password updated for ${changePasswordDialog}`);
    
    setChangePasswordDialog(null);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setShopProfile(prev => ({ ...prev, logo: result }));
      toast.success("Logo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setQrPreview(result);
      setShopProfile(prev => ({ ...prev, paymentQRCode: result }));
      toast.success("Payment QR code uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    localStorage.setItem("shop_profile", JSON.stringify(shopProfile));
    toast.success("Shop profile saved successfully");
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setShopProfile(prev => ({ ...prev, logo: "" }));
    toast.success("Logo removed");
  };

  const handleRemoveQR = () => {
    setQrPreview("");
    setShopProfile(prev => ({ ...prev, paymentQRCode: "" }));
    toast.success("Payment QR code removed");
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg font-medium">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="admins">
                <UserPlus className="h-4 w-4 mr-2" />
                Admins
              </TabsTrigger>
              <TabsTrigger value="theme">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Store className="h-4 w-4 mr-2" />
                Shop Profile
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Language</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Tamil">தமிழ் (Tamil)</SelectItem>
                        <SelectItem value="Telugu">తెలుగు (Telugu)</SelectItem>
                        <SelectItem value="Hindi">हिंदी (Hindi)</SelectItem>
                        <SelectItem value="French">Français (French)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current Language: <span className="font-semibold">{language}</span>
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p><strong>Note:</strong> Language preference is saved. Full UI translation support is planned for future updates.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Management */}
            <TabsContent value="admins" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Admin Users</CardTitle>
                    <Button onClick={() => setAddAdminDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{admin.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {admin.username === "MOGHITH" ? "Main Administrator" : "Administrator"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(admin.username)}
                          >
                            Change Password
                          </Button>
                          {admin.username !== "MOGHITH" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">🔐 Default Credentials</p>
                    <p className="text-amber-800 dark:text-amber-200 mt-1">
                      Username: <strong>MOGHITH</strong><br/>
                      Default Password: <strong>289236173476</strong><br/>
                      <span className="text-xs">Please change the default password immediately!</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Settings */}
            <TabsContent value="theme" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Theme</Label>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => handleThemeChange("light")}
                        className="h-24 flex-col"
                      >
                        <div className="mb-2 text-3xl">☀️</div>
                        Light Mode
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => handleThemeChange("dark")}
                        className="h-24 flex-col"
                      >
                        <div className="mb-2 text-3xl">🌙</div>
                        Dark Mode
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        onClick={() => handleThemeChange("system")}
                        className="h-24 flex-col"
                      >
                        <div className="mb-2 text-3xl">💻</div>
                        System
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current Theme: <span className="font-semibold capitalize">{theme}</span>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shop Profile */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Shop Logo</Label>
                      <div className="mt-2 space-y-4">
                        {logoPreview ? (
                          <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                            <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-contain" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={handleRemoveLogo}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">No logo uploaded</p>
                            </div>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Shop Name</Label>
                      <Input
                        value={shopProfile.name}
                        onChange={(e) => setShopProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Shop Address</Label>
                      <Textarea
                        value={shopProfile.address}
                        onChange={(e) => setShopProfile(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone Number 1</Label>
                        <Input
                          value={shopProfile.phone1}
                          onChange={(e) => setShopProfile(prev => ({ ...prev, phone1: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Phone Number 2</Label>
                        <Input
                          value={shopProfile.phone2}
                          onChange={(e) => setShopProfile(prev => ({ ...prev, phone2: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Shop Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment QR Code */}
            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a QR code for payment (G-Pay, PayTM, etc.). This will be displayed on printed bills.
                  </p>

                  <div className="space-y-4">
                    {qrPreview ? (
                      <div className="relative w-64 h-64 border rounded-lg overflow-hidden">
                        <img src={qrPreview} alt="Payment QR Code" className="w-full h-full object-contain" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveQR}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-64 h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No QR code uploaded</p>
                        </div>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="cursor-pointer"
                    />
                    <Button onClick={handleSaveProfile} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Payment QR Code
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm">
                      <strong>Note:</strong> This QR code will automatically appear in the top corner of all printed bills. 
                      You can change it anytime from this page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialog} onOpenChange={setAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Username *</Label>
              <Input
                value={newAdmin.username}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Confirm Password *</Label>
              <Input
                type="password"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin}>
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Confirmation Dialog */}
      <AlertDialog open={!!deleteAdminDialog} onOpenChange={() => setDeleteAdminDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete admin "{deleteAdminDialog?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAdmin}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={!!changePasswordDialog} onOpenChange={() => setChangePasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password for {changePasswordDialog}</DialogTitle>
            <DialogDescription>
              Enter and confirm the new password for this admin account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Password *</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label>Confirm New Password *</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmChangePassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}