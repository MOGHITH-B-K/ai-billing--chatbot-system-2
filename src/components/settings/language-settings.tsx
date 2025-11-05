"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Languages } from "lucide-react";

const languages = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "fr", label: "French (Français)" },
];

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("shop_language");
    if (saved) {
      setSelectedLanguage(saved);
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    localStorage.setItem("shop_language", value);
    toast.success(`Language changed to ${languages.find(l => l.value === value)?.label}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          <CardTitle>Language Settings</CardTitle>
        </div>
        <CardDescription>Choose your preferred language for the application</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedLanguage} onValueChange={handleLanguageChange}>
          <div className="space-y-3">
            {languages.map((lang) => (
              <div key={lang.value} className="flex items-center space-x-2">
                <RadioGroupItem value={lang.value} id={lang.value} />
                <Label htmlFor={lang.value} className="cursor-pointer">
                  {lang.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
