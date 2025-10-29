import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Search } from "lucide-react";
import type { ClientDTO } from "@/types";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientSchema,
  type UpdateClientSchema,
} from "@/lib/validation/client.schema";
import { useClientMutations } from "@/components/hooks/useClientMutations";
import { useGUSLookup } from "@/components/hooks/useGUSLookup";

interface ClientFormProps {
  client?: ClientDTO;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!client;

  const { createMutation, updateMutation } = useClientMutations(() => {
    setIsOpen(false);
    onSuccess?.();
  });

  const { lookupNIP, isLoading: isLoadingNIP } = useGUSLookup();

  const {
    register,
    handleSubmit: handleFormSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(isEditMode ? updateClientSchema : createClientSchema),
    mode: "all",
    defaultValues: {
      name: "",
      tax_id: "",
      street: "",
      city: "",
      postal_code: "",
      country: "Polska",
      email: "",
      phone: "",
      default_currency: "PLN" as const,
      default_hourly_rate: undefined,
    },
  });

  // Watch tax_id for GUS lookup button state
  const taxId = watch("tax_id");

  // Reset form when client prop changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (client) {
        reset({
          name: client.name,
          tax_id: client.tax_id || "",
          street: client.street || "",
          city: client.city || "",
          postal_code: client.postal_code || "",
          country: client.country || "Polska",
          email: client.email || "",
          phone: client.phone || "",
          default_currency: client.default_currency || "PLN",
          default_hourly_rate: client.default_hourly_rate || undefined,
        });
      } else {
        reset({
          name: "",
          tax_id: "",
          street: "",
          city: "",
          postal_code: "",
          country: "Polska",
          email: "",
          phone: "",
          default_currency: "PLN" as const,
          default_hourly_rate: undefined,
        });
      }
    }
  }, [isOpen, client, reset]);

  const handleFetchFromGUS = async () => {
    const data = await lookupNIP(taxId || "");
    if (data) {
      // Update form with fetched data, but preserve existing values if API didn't return them
      if (data.name) setValue("name", data.name);
      if (data.street) setValue("street", data.street);
      if (data.city) setValue("city", data.city);
      if (data.postalCode) setValue("postal_code", data.postalCode);
      if (data.country) setValue("country", data.country);
    }
  };

  const onSubmit = (data: CreateClientSchema | UpdateClientSchema) => {
    if (isEditMode && client) {
      updateMutation.mutate({ id: client.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="plain" size="sm">
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
          <DialogTitle>{isEditMode ? "Edytuj klienta" : "Dodaj nowego klienta"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Wprowadź zmiany w danych klienta." : "Wypełnij formularz, aby dodać nowego klienta."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa klienta *</Label>
              <Input id="name" {...register("name")} placeholder="np. Acme Sp. z o.o." aria-invalid={!!errors.name} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">NIP</Label>
              <div className="flex gap-2">
                <Input
                  id="tax_id"
                  {...register("tax_id")}
                  placeholder="1234567890"
                  maxLength={10}
                  className="flex-1"
                  aria-invalid={!!errors.tax_id}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleFetchFromGUS}
                  disabled={isLoadingNIP || isPending || !taxId || taxId.length !== 10}
                  title="Pobierz dane z Białej Listy VAT"
                  className="shrink-0"
                >
                  <Search className={`h-4 w-4 ${isLoadingNIP ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {errors.tax_id ? (
                <p className="text-sm text-destructive">{errors.tax_id.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Wprowadź 10-cyfrowy NIP i kliknij ikonę lupy, aby pobrać dane z Białej Listy VAT
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="biuro@acme.pl"
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register("phone")} placeholder="+48111222333" aria-invalid={!!errors.phone} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Ulica</Label>
              <Input
                id="street"
                {...register("street")}
                placeholder="ul. Biznesowa 10"
                aria-invalid={!!errors.street}
              />
              {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input id="city" {...register("city")} placeholder="Warszawa" aria-invalid={!!errors.city} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Kod pocztowy</Label>
              <Input
                id="postal_code"
                {...register("postal_code")}
                placeholder="00-001"
                aria-invalid={!!errors.postal_code}
              />
              {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Kraj</Label>
              <Input id="country" {...register("country")} placeholder="Polska" aria-invalid={!!errors.country} />
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_currency">Domyślna waluta</Label>
              <Controller
                control={control}
                name="default_currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="default_currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_hourly_rate">Domyślna stawka godzinowa</Label>
              <Input
                id="default_hourly_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("default_hourly_rate", {
                  setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                })}
                placeholder="150.00"
                aria-invalid={!!errors.default_hourly_rate}
              />
              {errors.default_hourly_rate && (
                <p className="text-sm text-destructive">{errors.default_hourly_rate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending
                ? isEditMode
                  ? "Zapisywanie..."
                  : "Dodawanie..."
                : isEditMode
                  ? "Zapisz zmiany"
                  : "Dodaj klienta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
