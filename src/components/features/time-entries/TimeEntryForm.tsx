import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import type { ClientDTO, TimeEntryWithRelationsDTO, AIInsightsStatusDTO } from "@/types";
import type { TimeEntryFormViewModel } from "./types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { hoursToHoursAndMinutes, hoursAndMinutesToHours } from "@/lib/helpers/time.helpers";

async function fetchAIInsightsStatus(): Promise<AIInsightsStatusDTO> {
  const response = await fetch("/api/ai-insights/status");
  if (!response.ok) throw new Error("Failed to fetch AI Insights status");
  return response.json();
}

const timeEntrySchema = z.object({
  id: z.string().optional(),
  client_id: z.string().min(1, "Klient jest wymagany"),
  date: z.date({ required_error: "Data jest wymagana" }),
  hours: z
    .string()
    .min(1, "Godziny są wymagane")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Godziny muszą być liczbą nieujemną",
    }),
  minutes: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 60), {
      message: "Minuty muszą być liczbą od 0 do 60",
    }),
  hourly_rate: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "Stawka musi być liczbą nieujemną",
    }),
  currency: z.string().optional(),
  public_description: z.string().optional(),
  private_note: z.string().optional(),
});

interface TimeEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimeEntryFormViewModel) => void;
  initialData?: TimeEntryWithRelationsDTO;
  clients: ClientDTO[];
  isSubmitting?: boolean;
}

export function TimeEntryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  clients,
  isSubmitting = false,
}: TimeEntryFormProps) {
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  // Fetch AI Insights status to show progress
  const { data: aiStatus } = useQuery({
    queryKey: ["ai-insights", "status"],
    queryFn: fetchAIInsightsStatus,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit: handleFormSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<TimeEntryFormViewModel>({
    resolver: zodResolver(timeEntrySchema),
    mode: "all",
    defaultValues: {
      client_id: "",
      date: new Date(),
      hours: "",
      minutes: "",
      hourly_rate: "",
      currency: "PLN",
      public_description: "",
      private_note: "",
    },
  });

  // Watch client_id para auto-fill
  const clientId = watch("client_id");

  // Automatyczne wypełnienie stawki i waluty przy wyborze klienta (tylko dla nowych wpisów)
  React.useEffect(() => {
    if (clientId && !initialData) {
      const selectedClient = clients.find((c) => c.id === clientId);
      if (selectedClient) {
        if (selectedClient.default_hourly_rate) {
          setValue("hourly_rate", selectedClient.default_hourly_rate.toString());
        }
        if (selectedClient.default_currency) {
          setValue("currency", selectedClient.default_currency);
        }
      }
    }
  }, [clientId, clients, initialData, setValue]);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      setDatePickerOpen(false);
      if (initialData) {
        const { hours, minutes } = hoursToHoursAndMinutes(initialData.hours);
        reset({
          id: initialData.id,
          client_id: initialData.client_id,
          date: new Date(initialData.date),
          hours: hours.toString(),
          minutes: minutes.toString(),
          hourly_rate: initialData.hourly_rate?.toString() || "",
          currency: initialData.currency || "PLN",
          public_description: initialData.public_description || "",
          private_note: initialData.private_note || "",
        });
      } else {
        reset({
          client_id: "",
          date: new Date(),
          hours: "",
          minutes: "",
          hourly_rate: "",
          currency: "PLN",
          public_description: "",
          private_note: "",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const handleSubmit = (data: TimeEntryFormViewModel) => {
    // Konwertuj godziny i minuty na całkowite godziny
    const totalHours = hoursAndMinutesToHours(Number(data.hours) || 0, Number(data.minutes) || 0);

    const submitData = {
      ...data,
      hours: totalHours.toString(),
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edytuj wpis czasu" : "Dodaj wpis czasu"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Zaktualizuj szczegóły wpisu czasu pracy." : "Dodaj nowy wpis czasu pracy dla klienta."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Klient <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              {errors.client_id && <p className="text-sm text-destructive">{errors.client_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Data <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                          errors.date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd MMM yyyy", { locale: pl }) : <span>Wybierz datę</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            setDatePickerOpen(false);
                          }
                        }}
                        locale={pl}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="hours">
                Godziny <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hours"
                type="number"
                min="0"
                placeholder="8"
                {...register("hours")}
                aria-invalid={!!errors.hours}
              />
              {errors.hours && <p className="text-sm text-destructive">{errors.hours.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Minuty</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="60"
                placeholder="30"
                {...register("minutes")}
                aria-invalid={!!errors.minutes}
              />
              {errors.minutes && <p className="text-sm text-destructive">{errors.minutes.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Stawka godzinowa</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                {...register("hourly_rate")}
                aria-invalid={!!errors.hourly_rate}
              />
              {errors.hourly_rate && <p className="text-sm text-destructive">{errors.hourly_rate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Waluta</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="PLN" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_description">Opis publiczny</Label>
            <Textarea
              id="public_description"
              placeholder="Opis, który będzie widoczny na fakturze..."
              {...register("public_description")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="private_note">
              Notatka prywatna
              {aiStatus && (
                <span className="ml-2 text-xs font-normal text-blue-600">
                  ✨ Dla AI Insights ({aiStatus.entries_with_notes}/{aiStatus.threshold})
                </span>
              )}
            </Label>
            <Textarea
              id="private_note"
              placeholder="Opisz swoją pracę... (ta notatka jest prywatna i będzie analizowana przez AI)"
              {...register("private_note")}
              rows={3}
              className="border-blue-200 focus:border-blue-400"
            />
            {aiStatus && !aiStatus.unlocked && (
              <p className="text-xs text-muted-foreground">
                💡 Jeszcze {aiStatus.threshold - aiStatus.entries_with_notes} wpisów z notatkami aby odblokować AI
                Insights
              </p>
            )}
            {aiStatus && aiStatus.unlocked && <p className="text-xs text-green-600">🎉 AI Insights odblokowany!</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : initialData ? "Zaktualizuj" : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
