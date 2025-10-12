import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit } from "lucide-react";
import type { CreateClientCommand, ClientDTO, UpdateClientCommand } from "@/types";
import { toast } from "sonner";

interface ClientFormProps {
  client?: ClientDTO;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!client;
  
  const [formData, setFormData] = useState<Partial<CreateClientCommand>>({
    name: "",
    country: "Polska",
    default_currency: "PLN",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        tax_id: client.tax_id || "",
        street: client.street || "",
        city: client.city || "",
        postal_code: client.postal_code || "",
        country: client.country,
        email: client.email || "",
        phone: client.phone || "",
        default_currency: client.default_currency,
        default_hourly_rate: client.default_hourly_rate || undefined,
      });
    }
  }, [client]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateClientCommand) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Nie udało się dodać klienta");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klient został dodany pomyślnie");
      setIsOpen(false);
      setFormData({
        name: "",
        country: "Polska",
        default_currency: "PLN",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientCommand }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Nie udało się zaktualizować klienta");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klient został zaktualizowany pomyślnie");
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error("Nazwa klienta jest wymagana");
      return;
    }

    const clientData = {
      name: formData.name.trim(),
      tax_id: formData.tax_id || undefined,
      street: formData.street || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country || "Polska",
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      default_currency: formData.default_currency || "PLN",
      default_hourly_rate: formData.default_hourly_rate || undefined,
    };

    if (isEditMode && client) {
      updateMutation.mutate({ id: client.id, data: clientData });
    } else {
      createMutation.mutate(clientData as CreateClientCommand);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj klienta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edytuj klienta" : "Dodaj nowego klienta"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa klienta *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. Acme Sp. z o.o."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">NIP</Label>
              <Input
                id="tax_id"
                value={formData.tax_id || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                placeholder="1234567890"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="biuro@acme.pl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+48111222333"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Ulica</Label>
              <Input
                id="street"
                value={formData.street || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="ul. Biznesowa 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Warszawa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Kod pocztowy</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="00-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Kraj</Label>
              <Input
                id="country"
                value={formData.country || "Polska"}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Polska"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_currency">Domyślna waluta</Label>
              <Select
                value={formData.default_currency || "PLN"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, default_currency: value as "PLN" | "EUR" | "USD" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_hourly_rate">Domyślna stawka godzinowa</Label>
              <Input
                id="default_hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.default_hourly_rate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, default_hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.name?.trim()}
            >
              {isPending 
                ? (isEditMode ? "Zapisywanie..." : "Dodawanie...") 
                : (isEditMode ? "Zapisz zmiany" : "Dodaj klienta")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
