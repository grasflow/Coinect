import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { useInvoiceGenerator } from "@/components/hooks/useInvoiceGenerator";
import { useGenerateInvoice } from "@/components/hooks/useGenerateInvoice";
import { useTimeEntries } from "@/components/hooks/useTimeEntries";
import { useClientsWithUnbilledTimeEntries } from "@/components/hooks/useClientsWithUnbilledTimeEntries";
import { ClientSelector } from "./ClientSelector";
import { UnbilledTimeEntriesSelector } from "./UnbilledTimeEntriesSelector";
import { ManualItemsEditor } from "./ManualItemsEditor";
import { InvoiceItemsEditor } from "./InvoiceItemsEditor";
import { InvoicePartiesPanel } from "./InvoicePartiesPanel";
import { InvoiceSettingsPanel } from "./InvoiceSettingsPanel";
import { InvoiceSummaryPanel } from "./InvoiceSummaryPanel";
import type { InvoiceItemViewModel } from "./types";
import type { TimeEntryWithRelationsDTO, Currency } from "@/types";
import QueryProvider from "@/components/QueryProvider";

const STEPS = [
  { number: 1, title: "Wybór klienta" },
  { number: 2, title: "Pozycje faktury" },
  { number: 3, title: "Ustawienia i podsumowanie" },
];

/**
 * Grupuje wpisy czasu według opisu
 */
function groupTimeEntriesByDescription(entries: TimeEntryWithRelationsDTO[]): InvoiceItemViewModel[] {
  const groups = new Map<string, TimeEntryWithRelationsDTO[]>();

  entries.forEach((entry) => {
    const description = (entry.description || "").trim() || "Usługa";
    if (!groups.has(description)) {
      groups.set(description, []);
    }
    const groupEntries = groups.get(description);
    if (groupEntries) {
      groupEntries.push(entry);
    }
  });

  return Array.from(groups.entries()).map(([description, groupEntries], index) => {
    const totalHours = groupEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0);
    const avgRate = groupEntries.reduce((sum, e) => sum + parseFloat(e.hourly_rate), 0) / groupEntries.length;

    return {
      position: index + 1,
      description,
      timeEntryIds: groupEntries.map((e) => e.id),
      timeEntries: groupEntries,
      quantity: totalHours,
      unitPrice: avgRate,
      netAmount: totalHours * avgRate,
    };
  });
}

function InvoiceGeneratorContent() {
  const {
    state,
    goToNextStep,
    goToPreviousStep,
    selectClient,
    selectTimeEntries,
    setItems,
    setInvoiceMode,
    setManualItems,
    updateSettings,
  } = useInvoiceGenerator();

  const { data: timeEntriesData } = useTimeEntries({
    clientId: state.clientId,
    status: "unbilled",
    page: 1,
    pageSize: 1000,
  });

  // Pobierz klientów z niewyfakturowanymi wpisami dla walidacji
  const { data: clientsWithUnbilled } = useClientsWithUnbilledTimeEntries();

  const generateMutation = useGenerateInvoice();

  // Pobierz dane profilu użytkownika
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Nie udało się pobrać profilu");
      return res.json();
    },
  });

  // Pobierz dane klienta
  const { data: clientData } = useQuery({
    queryKey: ["client", state.clientId],
    queryFn: async () => {
      if (!state.clientId) return null;
      const res = await fetch(`/api/clients/${state.clientId}`);
      if (!res.ok) throw new Error("Nie udało się pobrać danych klienta");
      return res.json();
    },
    enabled: !!state.clientId,
  });

  // Waluta klienta
  const clientCurrency = useMemo(() => {
    if (!state.clientId || !timeEntriesData?.data.length) return "PLN";
    return (timeEntriesData.data[0]?.client?.currency as Currency) || "PLN";
  }, [state.clientId, timeEntriesData]);

  // Aktualizacja waluty w podsumowaniu
  useEffect(() => {
    if (clientCurrency !== state.summary.currency) {
      updateSettings({ exchangeRate: null, isCustomExchangeRate: false });
    }
  }, [clientCurrency, state.summary.currency, updateSettings]);

  // Automatyczne grupowanie wpisów po wyborze
  useEffect(() => {
    if (state.step === 2 && state.selectedTimeEntryIds.length > 0) {
      const selectedEntries = timeEntriesData?.data.filter((e) => state.selectedTimeEntryIds.includes(e.id)) || [];

      if (selectedEntries.length > 0) {
        const grouped = groupTimeEntriesByDescription(selectedEntries);
        setItems(grouped);
      }
    }
  }, [state.selectedTimeEntryIds, state.step, timeEntriesData, setItems]);

  const handleNextStep = () => {
    if (state.step === 1 && !state.clientId) {
      toast.error("Wybierz klienta");
      return;
    }

    if (state.step === 2) {
      if (state.invoiceMode === "time_entries" && state.selectedTimeEntryIds.length === 0) {
        toast.error("Wybierz co najmniej jeden wpis czasu");
        return;
      }

      if (state.invoiceMode === "manual" && state.manualItems.length === 0) {
        toast.error("Dodaj co najmniej jedną pozycję faktury");
        return;
      }

      // Walidacja manualnych pozycji
      if (state.invoiceMode === "manual") {
        const invalidItems = state.manualItems.filter(
          (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
        );

        if (invalidItems.length > 0) {
          toast.error("Wszystkie pozycje muszą mieć poprawny opis, ilość i cenę jednostkową");
          return;
        }
      }
    }

    goToNextStep();
  };

  const handleGenerateInvoice = async () => {
    if (!state.clientId) {
      toast.error("Brak wybranego klienta");
      return;
    }

    // Sprawdź czy są pozycje do fakturowania
    const hasItems = state.invoiceMode === "time_entries" ? state.items.length > 0 : state.manualItems.length > 0;

    if (!hasItems) {
      toast.error("Brak pozycji na fakturze");
      return;
    }

    try {
      const payload = {
        client_id: state.clientId,
        issue_date: state.settings.issueDate.toISOString().split("T")[0],
        sale_date: state.settings.saleDate.toISOString().split("T")[0],
        vat_rate: state.settings.vatRate,
        custom_exchange_rate: state.settings.exchangeRate || null,
        // Dodaj dane warunkowo w zależności od trybu
        ...(state.invoiceMode === "time_entries" && {
          time_entry_ids: state.selectedTimeEntryIds,
          items: state.items.map((item) => ({
            description: item.description,
            time_entry_ids: item.timeEntryIds,
          })),
        }),
        ...(state.invoiceMode === "manual" && {
          manual_items: state.manualItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        }),
      };

      const result = await generateMutation.mutateAsync(payload);

      toast.success(result.message || `Faktura ${result.invoice_number} została wygenerowana`, {
        action: result.pdf_url
          ? {
              label: "Pobierz PDF",
              onClick: () => window.open(result.pdf_url, "_blank"),
            }
          : undefined,
      });

      // Reset formularza po sukcesie
      window.location.href = "/invoices"; // Przekierowanie do listy faktur
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się wygenerować faktury";
      toast.error(message);
    }
  };

  const canProceed = (() => {
    if (state.step === 1) {
      // W trybie time_entries sprawdź czy są klienci z niewyfakturowanymi wpisami
      if (state.invoiceMode === "time_entries") {
        return !!state.clientId && (clientsWithUnbilled?.length ?? 0) > 0;
      }
      return !!state.clientId;
    }
    if (state.step === 2) {
      return state.invoiceMode === "time_entries"
        ? state.selectedTimeEntryIds.length > 0
        : state.manualItems.length > 0;
    }
    return state.step === 3;
  })();

  return (
    <div className="space-y-6">
      {/* Nagłówek strony */}
      <h1 className="text-3xl font-bold">Nowa Faktura</h1>

      {/* Stepper */}
      <Card data-step-indicator>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex flex-1 items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      state.step === step.number
                        ? "border-primary bg-primary text-primary-foreground"
                        : state.step > step.number
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {state.step > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{step.title}</div>
                    {state.step === step.number && (
                      <Badge variant="secondary" className="mt-1">
                        Aktywny krok
                      </Badge>
                    )}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 flex-1 transition-colors ${
                      state.step > step.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Krok 1: Wybór klienta i trybu */}
      {state.step === 1 && (
        <div className="space-y-6">
          <ClientSelector
            value={state.clientId}
            onChange={selectClient}
            mode={state.invoiceMode === "time_entries" ? "with_unbilled_time_entries" : "all"}
          />

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tryb generowania faktury</h3>
                <Tabs
                  value={state.invoiceMode}
                  onValueChange={(value) => {
                    const newMode = value as "time_entries" | "manual";

                    // Ostrzeżenie jeśli użytkownik miał dane w poprzednim trybie
                    if (newMode === "time_entries" && state.manualItems.length > 0) {
                      if (!confirm("Zmiana trybu spowoduje utratę wprowadzonych pozycji manualnych. Kontynuować?")) {
                        return;
                      }
                      setManualItems([]);
                    }

                    if (newMode === "manual" && state.selectedTimeEntryIds.length > 0) {
                      if (!confirm("Zmiana trybu spowoduje utratę wybranych wpisów czasu. Kontynuować?")) {
                        return;
                      }
                      selectTimeEntries([]);
                    }

                    setInvoiceMode(newMode);
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="time_entries" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />Z wpisów czasu
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Faktura manualna
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="time_entries" className="mt-4">
                    <div className="text-sm text-muted-foreground">
                      Utwórz fakturę na podstawie zarejestrowanych godzin pracy. System automatycznie pogrupuje wpisy
                      czasowe w pozycje faktury.
                    </div>
                  </TabsContent>
                  <TabsContent value="manual" className="mt-4">
                    <div className="text-sm text-muted-foreground">
                      Ręcznie wprowadź pozycje faktury bez konieczności wyboru wpisów czasowych. Idealne dla stałych
                      opłat, produktów lub usług bez rejestracji czasu.
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Krok 2: Wybór wpisów / pozycje manualne */}
      {state.step === 2 && state.clientId && (
        <div className="space-y-6">
          {state.invoiceMode === "time_entries" ? (
            <UnbilledTimeEntriesSelector
              clientId={state.clientId}
              selectedIds={state.selectedTimeEntryIds}
              onSelectionChange={selectTimeEntries}
            />
          ) : (
            <ManualItemsEditor items={state.manualItems} onChange={setManualItems} />
          )}
        </div>
      )}

      {/* Krok 3: Ustawienia i podsumowanie */}
      {state.step === 3 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Dane stron faktury */}
            {profileData && clientData && (
              <InvoicePartiesPanel
                issuer={{
                  name: profileData.company_name || profileData.full_name,
                  tax_id: profileData.tax_id,
                  address: profileData.address,
                  city: profileData.city,
                  postal_code: profileData.postal_code,
                }}
                recipient={{
                  name: clientData.name,
                  tax_id: clientData.tax_id,
                  address: clientData.address,
                  city: clientData.city,
                  postal_code: clientData.postal_code,
                }}
              />
            )}

            <InvoiceItemsEditor items={state.items} onChange={setItems} editable={true} />
            <InvoiceSettingsPanel settings={state.settings} onChange={updateSettings} currency={clientCurrency} />
          </div>
          <div>
            <InvoiceSummaryPanel
              summary={{ ...state.summary, currency: clientCurrency }}
              onAction={handleGenerateInvoice}
              actionLabel="Wygeneruj fakturę"
              actionDisabled={state.items.length === 0}
              isLoading={generateMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Nawigacja */}
      <Card>
        <CardContent className="flex justify-between pt-6">
          <Button variant="outline" onClick={goToPreviousStep} disabled={state.step === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wstecz
          </Button>

          {state.step < 3 && (
            <Button onClick={handleNextStep} disabled={!canProceed}>
              Dalej
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InvoiceGeneratorView() {
  return (
    <QueryProvider>
      <InvoiceGeneratorContent />
    </QueryProvider>
  );
}
