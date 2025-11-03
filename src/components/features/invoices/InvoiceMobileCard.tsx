import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { Text, Muted } from "@/components/ui/typography";
import type { InvoiceRowProps } from "./types";

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function InvoiceMobileCard({ invoice, onDownloadPDF, onEdit, onTogglePaid, onDelete }: InvoiceRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isPaid = invoice.is_paid || invoice.status === "paid";

  const handleTogglePaid = () => {
    onTogglePaid(invoice.id, !isPaid);
  };

  const handleDelete = () => {
    onDelete(invoice.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={isPaid ? "opacity-60" : ""}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header: Invoice number and status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Text className="font-semibold truncate">{invoice.invoice_number}</Text>
                <Muted className="text-xs">{new Date(invoice.issue_date).toLocaleDateString("pl-PL")}</Muted>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={isPaid ? "default" : "secondary"} className="text-xs">
                  {isPaid ? "Zapłacone" : "Niezapłacone"}
                </Badge>
                {invoice.is_edited && (
                  <Badge variant="outline" className="text-xs">
                    Edytowano
                  </Badge>
                )}
              </div>
            </div>

            {/* Client information */}
            <div>
              <Muted className="text-xs">Klient</Muted>
              <Text className="font-medium">{invoice.client?.name || "Brak danych"}</Text>
              {invoice.client?.tax_id && <Muted className="text-xs">NIP: {invoice.client.tax_id}</Muted>}
            </div>

            {/* Amount */}
            <div>
              <Muted className="text-xs">Kwota brutto</Muted>
              <Text className="font-semibold text-lg">
                {formatCurrency(invoice.gross_amount)} {invoice.currency}
              </Text>
              {invoice.currency !== "PLN" && invoice.gross_amount_pln && (
                <Muted className="text-xs">({formatCurrency(invoice.gross_amount_pln)} PLN)</Muted>
              )}
            </div>

            {/* Actions - using larger buttons for better touch targets */}
            <div className="space-y-2 pt-2 border-t">
              {/* Primary action - toggle paid status */}
              <Button
                variant={isPaid ? "outline" : "default"}
                size="default"
                onClick={handleTogglePaid}
                className="w-full"
              >
                {isPaid ? (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Oznacz jako niezapłacone
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Oznacz jako zapłacone
                  </>
                )}
              </Button>

              {/* Secondary actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="default" onClick={() => onDownloadPDF(invoice.id)} title="Pobierz PDF">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Pobierz PDF</span>
                </Button>
                <Button variant="outline" size="default" onClick={() => onEdit(invoice.id)} title="Edytuj fakturę">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edytuj fakturę</span>
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Usuń fakturę"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Usuń fakturę</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć fakturę {invoice.invoice_number}? Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Usuń fakturę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
