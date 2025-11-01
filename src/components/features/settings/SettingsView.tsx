import * as React from "react";
import { toast } from "sonner";
import { User, Upload, Palette, Loader2, Save, LoaderIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H1, Muted } from "@/components/ui/typography";
import { Stack } from "@/components/ui/container";
import { useProfile, useUpdateProfile, useUploadLogo } from "@/components/hooks/useProfile";
import QueryProvider from "@/components/QueryProvider";

function SettingsViewContent() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadLogoMutation = useUploadLogo();

  const [formData, setFormData] = React.useState({
    full_name: "",
    tax_id: "",
    street: "",
    city: "",
    postal_code: "",
    country: "Polska",
    email: "",
    phone: "",
    bank_account: "",
    bank_name: "",
    bank_swift: "",
    accent_color: "#2563EB",
  });

  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        tax_id: profile.tax_id || "",
        street: profile.street || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "Polska",
        email: profile.email || "",
        phone: profile.phone || "",
        bank_account: profile.bank_account || "",
        bank_name: profile.bank_name || "",
        bank_swift: profile.bank_swift || "",
        accent_color: profile.accent_color || "#2563EB",
      });

      if (profile.logo_url) {
        setLogoPreview(profile.logo_url);
      }
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nieprawidłowy format pliku. Dozwolone: PNG, JPG");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Rozmiar pliku przekracza 2MB");
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    try {
      await uploadLogoMutation.mutateAsync(logoFile);
      toast.success("Logo zostało przesłane");
      setLogoFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się przesłać logo");
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Ustawienia zostały zapisane");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać ustawień");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <Muted>Ładowanie ustawień...</Muted>
        </div>
      </div>
    );
  }

  return (
    <Stack className="space-y-6">
      {/* Header */}
      <div>
        <H1>Ustawienia</H1>
        <Muted>Zarządzaj swoim profilem i preferencjami fakturowania</Muted>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>Dane wystawcy faktury</CardTitle>
          </div>
          <CardDescription>Te dane będą wyświetlane na wszystkich nowych fakturach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name" className="mb-1.5">
                Imię i nazwisko / Nazwa firmy *
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Jan Kowalski"
              />
            </div>

            <div>
              <Label htmlFor="tax_id" className="mb-1.5">
                NIP
              </Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="1234567890"
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-1.5">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="jan@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="mb-1.5">
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+48 123 456 789"
              />
            </div>
          </div>

          {/* Address Section */}
          <div>
            <Label className="mb-2">Adres</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="ul. Przykładowa 123"
                />
              </div>
              <div>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Warszawa"
                />
              </div>
              <div>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="00-000"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Polska"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_account" className="mb-1.5">
                Numer konta bankowego
              </Label>
              <Input
                id="bank_account"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                placeholder="PL12 3456 7890 1234 5678 9012 3456"
              />
            </div>

            <div>
              <Label htmlFor="bank_name" className="mb-1.5">
                Nazwa banku
              </Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="mBank SA"
              />
            </div>

            <div>
              <Label htmlFor="bank_swift" className="mb-1.5">
                Kod SWIFT/BIC
              </Label>
              <Input
                id="bank_swift"
                name="bank_swift"
                value={formData.bank_swift}
                onChange={handleInputChange}
                placeholder="BREXPLPWMBK"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <CardTitle>Logo na fakturze</CardTitle>
          </div>
          <CardDescription>Prześlij logo, które będzie wyświetlane na fakturach (PNG, JPG, max 2MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logoPreview && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-contain bg-white rounded border"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Podgląd logo</p>
                  <p className="text-sm text-gray-600">Logo będzie wyświetlane w lewym górnym rogu faktury</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                  Usuń
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Wybierz plik
              </Button>

              {logoFile && (
                <Button variant="filled" onClick={handleUploadLogo} disabled={uploadLogoMutation.isPending}>
                  {uploadLogoMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Przesyłanie...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Prześlij logo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Styling */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Wygląd faktury</CardTitle>
          </div>
          <CardDescription>Dostosuj kolorystykę faktur do swojego brandingu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="accent_color" className="mb-1">
                  Kolor akcentu
                </Label>
                <Muted className="text-sm">Kolor nagłówków i linii na fakturach</Muted>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="accent_color"
                  name="accent_color"
                  value={formData.accent_color}
                  onChange={handleInputChange}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.accent_color}
                  onChange={handleInputChange}
                  name="accent_color"
                  className="w-32"
                  placeholder="#2563EB"
                />
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium mb-3">Podgląd koloru:</p>
              <div className="space-y-2">
                <div className="h-2 rounded" style={{ backgroundColor: formData.accent_color }}></div>
                <div
                  className="px-4 py-2 rounded text-white font-semibold"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  Nagłówek faktury
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="filled" size="lg" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Zapisz ustawienia
            </>
          )}
        </Button>
      </div>
    </Stack>
  );
}

export default function SettingsView() {
  return (
    <QueryProvider>
      <SettingsViewContent />
    </QueryProvider>
  );
}
