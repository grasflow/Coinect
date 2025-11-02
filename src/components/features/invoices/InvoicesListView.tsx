import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { H1, Muted, Text } from "@/components/ui/typography";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { InvoicesFilters } from "./InvoicesFilters";
import { InvoiceRow } from "./InvoiceRow";
import { useInvoices, useToggleInvoicePaid, useDeleteInvoice, useInvoiceTotals } from "@/components/hooks/useInvoices";
import { useClients } from "@/components/hooks/useClients";
import { InvoiceSummary } from "./InvoiceSummary";
import type { InvoicesFilterState } from "./types";
import QueryProvider from "@/components/QueryProvider";

function InvoicesListContent() {
  const [filters, setFilters] = useState<InvoicesFilterState>({
    status: "all",
    page: 1,
    pageSize: 20,
  });

  const { data: invoicesData, isLoading } = useInvoices(filters);
  const { data: totalsData } = useInvoiceTotals(filters);
  const { data: clientsData } = useClients();
  const togglePaidMutation = useToggleInvoicePaid();
  const deleteMutation = useDeleteInvoice();

  const invoices = invoicesData?.data || [];
  const total = invoicesData?.total || 0;
  const totalPages = Math.ceil(total / filters.pageSize);

  const handleDownloadPDF = async (invoiceId: string) => {
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

  const handleEdit = (invoiceId: string) => {
    window.location.href = `/invoices/${invoiceId}/edit`;
  };

  const handleTogglePaid = async (invoiceId: string, isPaid: boolean) => {
    try {
      await togglePaidMutation.mutateAsync({ invoiceId, isPaid });
      toast.success(isPaid ? "Faktura oznaczona jako zapłacona" : "Faktura oznaczona jako niezapłacona");
    } catch {
      toast.error("Nie udało się zaktualizować statusu faktury");
    }
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      await deleteMutation.mutateAsync(invoiceId);
      toast.success("Faktura została usunięta");
    } catch {
      toast.error("Nie udało się usunąć faktury");
    }
  };

  const handlePreviousPage = () => {
    if (filters.page > 1) {
      setFilters({ ...filters, page: filters.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (filters.page < totalPages) {
      setFilters({ ...filters, page: filters.page + 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <H1>Faktury</H1>
          <Muted>Zarządzaj fakturami i śledź płatności</Muted>
        </div>
        <Button onClick={() => (window.location.href = "/invoices/new")} className="self-start md:self-auto md:shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          <Text className="md:hidden">Nowa faktura</Text>
          <span className="hidden md:inline">Nowa faktura</span>
        </Button>
      </div>

      {/* Filtry */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesFilters filters={filters} onChange={setFilters} clients={clientsData || []} />
        </CardContent>
      </Card>

      {/* Tabela faktur */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle data-testid="invoices-count">
              Lista faktur ({total}){" "}
              {filters.page > 1 && (
                <span className="text-sm font-normal text-muted-foreground">
                  - strona {filters.page} z {totalPages}
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <Text className="font-medium mb-2">
                {filters.clientId || filters.dateRange || filters.status !== "all"
                  ? "Nie znaleziono faktur"
                  : "Brak faktur"}
              </Text>
              <Muted className="mb-4">
                {filters.clientId || filters.dateRange || filters.status !== "all"
                  ? "Spróbuj zmienić kryteria wyszukiwania"
                  : "Utwórz swoją pierwszą fakturę"}
              </Muted>
              {filters.clientId || filters.dateRange || filters.status !== "all" ? (
                <Button
                  variant="tinted"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      status: "all",
                      page: 1,
                      pageSize: filters.pageSize,
                    })
                  }
                >
                  Wyczyść filtry
                </Button>
              ) : (
                <Button variant="tinted" size="sm" onClick={() => (window.location.href = "/invoices/new")}>
                  Utwórz pierwszą fakturę
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead className="text-right">Kwota brutto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      onDownloadPDF={handleDownloadPDF}
                      onEdit={handleEdit}
                      onTogglePaid={handleTogglePaid}
                      onDelete={handleDelete}
                    />
                  ))}
                </TableBody>
              </Table>

              {/* Paginacja */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground" data-testid="pagination-info">
                    Strona {filters.page} z {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={filters.page === 1}>
                      Poprzednia
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={filters.page === totalPages}>
                      Następna
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Podsumowanie faktur */}
      {totalsData && (
        <InvoiceSummary
          netAmount={totalsData.netAmount}
          grossAmount={totalsData.grossAmount}
          count={totalsData.count}
          currency={filters.currency !== "all" ? filters.currency : "PLN"}
        />
      )}
    </div>
  );
}

export function InvoicesListView() {
  return (
    <QueryProvider>
      <InvoicesListContent />
    </QueryProvider>
  );
}
