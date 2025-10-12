"use client"

import * as React from "react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { z } from "zod"
import type { ClientDTO, TagDTO, TimeEntryWithRelationsDTO } from "@/types"
import type { TimeEntryFormViewModel } from "./types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TagSelect } from "./TagSelect"

const timeEntrySchema = z.object({
  client_id: z.string().min(1, "Klient jest wymagany"),
  date: z.date({ required_error: "Data jest wymagana" }),
  hours: z.string()
    .min(1, "Godziny są wymagane")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Godziny muszą być liczbą większą od 0",
    }),
  hourly_rate: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "Stawka musi być liczbą nieujemną",
    }),
  currency: z.string().optional(),
  public_description: z.string().optional(),
  private_note: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
});

type TimeEntryFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimeEntryFormViewModel) => void;
  initialData?: TimeEntryWithRelationsDTO;
  clients: ClientDTO[];
  tags: TagDTO[];
  isSubmitting?: boolean;
};

export function TimeEntryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  clients,
  tags,
  isSubmitting = false,
}: TimeEntryFormProps) {
  const [formData, setFormData] = React.useState<TimeEntryFormViewModel>({
    id: initialData?.id,
    client_id: initialData?.client_id || "",
    date: initialData?.date ? new Date(initialData.date) : new Date(),
    hours: initialData?.hours?.toString() || "",
    hourly_rate: initialData?.hourly_rate?.toString() || "",
    currency: initialData?.currency || "PLN",
    public_description: initialData?.public_description || "",
    private_note: initialData?.private_note || "",
    tag_ids: initialData?.tags?.map((t) => t.tag.id) || [],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Automatyczne wypełnienie stawki i waluty przy wyborze klienta (tylko dla nowych wpisów)
  const handleClientChange = (clientId: string) => {
    setFormData((prev) => {
      const selectedClient = clients.find((c) => c.id === clientId);
      
      // Tylko dla nowych wpisów automatycznie wypełnij stawkę i walutę
      if (!initialData && selectedClient) {
        return {
          ...prev,
          client_id: clientId,
          hourly_rate: selectedClient.default_hourly_rate?.toString() || prev.hourly_rate,
          currency: selectedClient.default_currency || prev.currency,
        };
      }
      
      return { ...prev, client_id: clientId };
    });
  };

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        id: initialData.id,
        client_id: initialData.client_id,
        date: new Date(initialData.date),
        hours: initialData.hours.toString(),
        hourly_rate: initialData.hourly_rate?.toString() || "",
        currency: initialData.currency || "PLN",
        public_description: initialData.public_description || "",
        private_note: initialData.private_note || "",
        tag_ids: initialData.tags?.map((t) => t.tag.id) || [],
      });
    } else if (isOpen && !initialData) {
      setFormData({
        client_id: "",
        date: new Date(),
        hours: "",
        hourly_rate: "",
        currency: "PLN",
        public_description: "",
        private_note: "",
        tag_ids: [],
      });
    }
    setErrors({});
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      timeEntrySchema.parse(formData);
      onSubmit(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edytuj wpis czasu" : "Dodaj wpis czasu"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Zaktualizuj szczegóły wpisu czasu pracy."
              : "Dodaj nowy wpis czasu pracy dla klienta."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Klient <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={handleClientChange}
              >
                <SelectTrigger id="client_id" aria-invalid={!!errors.client_id}>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Data <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                      errors.date && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "dd MMM yyyy", { locale: pl })
                    ) : (
                      <span>Wybierz datę</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      date && setFormData((prev) => ({ ...prev, date }))
                    }
                    locale={pl}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hours">
                Godziny <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="8.5"
                value={formData.hours}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hours: e.target.value }))
                }
                aria-invalid={!!errors.hours}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">{errors.hours}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Stawka godzinowa</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hourly_rate: e.target.value }))
                }
                aria-invalid={!!errors.hourly_rate}
              />
              {errors.hourly_rate && (
                <p className="text-sm text-destructive">{errors.hourly_rate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Waluta</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="PLN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_description">Opis publiczny</Label>
            <Textarea
              id="public_description"
              placeholder="Opis, który będzie widoczny na fakturze..."
              value={formData.public_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  public_description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="private_note">Notatka prywatna</Label>
            <Textarea
              id="private_note"
              placeholder="Twoja prywatna notatka..."
              value={formData.private_note}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  private_note: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tags">Tagi</Label>
              <TagSelect
                value={formData.tag_ids || []}
                onChange={(tagIds) =>
                  setFormData((prev) => ({ ...prev, tag_ids: tagIds }))
                }
                tags={tags}
                placeholder="Dodaj tagi"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : initialData ? "Zaktualizuj" : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

