import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { EditWarningBanner } from "./EditWarningBanner";
import { InvoiceItemsEditor } from "./InvoiceItemsEditor";
import { InvoiceSettingsPanel } from "./InvoiceSettingsPanel";
import { InvoiceSummaryPanel } from "./InvoiceSummaryPanel";
import { useInvoiceEditState, useUpdateInvoice } from "@/components/hooks/useInvoiceEdit";
import type { InvoiceItemViewModel, InvoiceSettingsViewModel } from "./types";
import QueryProvider from "@/components/QueryProvider";

interface InvoiceEditViewProps {
  invoiceId: string;
}

function InvoiceEditContent({ invoiceId }: InvoiceEditViewProps) {
  const { state: initialState, isLoading } = useInvoiceEditState(invoiceId);
  const updateMutation = useUpdateInvoice(invoiceId);

  const [items, setItems] = useState<InvoiceItemViewModel[]>([]);
  const [settings, setSettings] = useState<InvoiceSettingsViewModel | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [isModified, setIsModified] = useState(false);

  // Przechowuj oryginalne wartości w ref aby uniknąć nieskończonej pętli
  const originalItemsRef = useRef<InvoiceItemViewModel[]>([]);
  const originalSettingsRef = useRef<InvoiceSettingsViewModel | null>(null);
  const isInitializedRef = useRef(false);

  // Inicjalizacja stanu z danych z API (tylko raz)
  useEffect(() => {
    if (initialState && !isInitializedRef.current) {
      setItems(initialState.items);
      setSettings(initialState.settings);
      originalItemsRef.current = initialState.items;
      originalSettingsRef.current = initialState.settings;
      isInitializedRef.current = true;
    }
  }, [initialState]);

  // Śledzenie modyfikacji (porównaj z oryginalnymi wartościami z ref)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const itemsChanged = JSON.stringify(items) !== JSON.stringify(originalItemsRef.current);
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettingsRef.current);

    setIsModified(itemsChanged || settingsChanged);
  }, [items, settings]);

  const handleUpdateSettings = useCallback((updates: Partial<InvoiceSettingsViewModel>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const handleSave = async () => {
    if (!settings || !initialState) return;

    try {
      await updateMutation.mutateAsync({
        issue_date: settings.issueDate.toISOString().split("T")[0],
        sale_date: settings.saleDate.toISOString().split("T")[0],
        vat_rate: settings.vatRate,
        items: items.map((item) => ({
          position: item.position,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        custom_exchange_rate: settings.exchangeRate || null,
      });

      // Zaktualizuj referencje do nowych wartości po zapisaniu
      originalItemsRef.current = items;
      originalSettingsRef.current = settings;

      toast.success("Faktura została zaktualizowana");
      setIsModified(false);

      // Opcjonalnie: przekierowanie do listy
      setTimeout(() => {
        window.location.href = "/invoices";
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się zaktualizować faktury";
      toast.error(message);
    }
  };

  const handleDownloadPDF = async () => {
    if (!initialState?.invoice) return;

    const toastId = toast.loading("Generowanie PDF...");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        throw new Error("Nie udało się wygenerować PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Pobierz nazwę pliku z nagłówka Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `faktura_${invoiceId}.pdf`;

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF został pobrany", { id: toastId });
    } catch (error) {
      toast.error("Nie udało się pobrać PDF", { id: toastId });
    }
  };

  // Obliczenie podsumowania - zmemoizowane aby uniknąć niepotrzebnych re-renderów
  const summary = useMemo(() => {
    if (!settings || !initialState) {
      return {
        netAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        grossAmount: 0,
        currency: "PLN",
        exchangeRate: null,
        grossAmountPLN: null,
      };
    }

    const netAmount = items.reduce((sum, item) => sum + item.netAmount, 0);
    const vatAmount = netAmount * (settings.vatRate / 100);
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount,
      vatRate: settings.vatRate,
      vatAmount,
      grossAmount,
      currency: initialState.invoice.currency,
      exchangeRate: settings.exchangeRate,
      grossAmountPLN:
        settings.exchangeRate && initialState.invoice.currency !== "PLN" ? grossAmount * settings.exchangeRate : null,
    };
  }, [items, settings, initialState]);

  const handleBack = () => {
    if (isModified) {
      const confirm = window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?");
      if (!confirm) return;
    }
    window.location.href = "/invoices";
  };

  if (isLoading || !initialState || !settings) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded-md bg-muted" />
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  const invoice = initialState.invoice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="plain" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">Edycja faktury {invoice.invoice_number}</h1>
              {isModified && <Badge>Niezapisane zmiany</Badge>}
            </div>
            <p className="text-muted-foreground">Klient: {invoice.client?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Pobierz PDF
          </Button>
          <Button onClick={handleSave} disabled={!isModified || updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {showWarning && <EditWarningBanner onDismiss={() => setShowWarning(false)} />}

      {/* Informacje o fakturze */}
      <Card>
        <CardHeader>
          <CardTitle>Informacje o fakturze</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Numer faktury</div>
              <div className="font-semibold">{invoice.invoice_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Waluta</div>
              <div className="font-semibold">{invoice.currency}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={invoice.is_paid ? "bg-green-500/10 text-green-700 dark:text-green-400" : ""}>
                {invoice.is_paid ? "Zapłacone" : "Niezapłacone"}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Data utworzenia</div>
              <div className="font-semibold">{new Date(invoice.created_at).toLocaleDateString("pl-PL")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout edycji */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceItemsEditor items={items} onChange={setItems} editable={true} />
          <InvoiceSettingsPanel settings={settings} onChange={handleUpdateSettings} currency={invoice.currency} />
        </div>
        <div>
          <InvoiceSummaryPanel
            summary={summary}
            onAction={handleSave}
            actionLabel="Zapisz zmiany"
            actionDisabled={!isModified}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

export function InvoiceEditView({ invoiceId }: InvoiceEditViewProps) {
  return (
    <QueryProvider>
      <InvoiceEditContent invoiceId={invoiceId} />
    </QueryProvider>
  );
}
