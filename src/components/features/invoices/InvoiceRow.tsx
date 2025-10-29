import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
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
import type { InvoiceRowProps } from "./types";

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function InvoiceRow({ invoice, onDownloadPDF, onEdit, onTogglePaid, onDelete }: InvoiceRowProps) {
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
      <TableRow className={isPaid ? "opacity-60" : ""}>
        {/* Numer faktury */}
        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>

        {/* Data wystawienia */}
        <TableCell>{new Date(invoice.issue_date).toLocaleDateString("pl-PL")}</TableCell>

        {/* Klient */}
        <TableCell>
          <div>
            <div className="font-medium">{invoice.client?.name || "Brak danych"}</div>
            {invoice.client?.tax_id && (
              <div className="text-xs text-muted-foreground">NIP: {invoice.client.tax_id}</div>
            )}
          </div>
        </TableCell>

        {/* Kwota brutto */}
        <TableCell className="text-right">
          <div className="font-semibold">
            {formatCurrency(invoice.gross_amount)} {invoice.currency}
          </div>
          {invoice.currency !== "PLN" && invoice.gross_amount_pln && (
            <div className="text-xs text-muted-foreground">({formatCurrency(invoice.gross_amount_pln)} PLN)</div>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={isPaid ? "default" : "secondary"}>{isPaid ? "Zapłacone" : "Niezapłacone"}</Badge>
            {invoice.is_edited && (
              <Badge variant="outline" className="text-xs">
                Edytowano
              </Badge>
            )}
          </div>
        </TableCell>

        {/* Akcje */}
        <TableCell>
          <div className="flex items-center gap-1">
            {/* Toggle Paid */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePaid}
              title={isPaid ? "Oznacz jako niezapłacone" : "Oznacz jako zapłacone"}
            >
              {isPaid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Download PDF */}
            <Button variant="ghost" size="sm" onClick={() => onDownloadPDF(invoice.id)} title="Pobierz PDF">
              <Download className="h-4 w-4" />
            </Button>

            {/* Edit */}
            <Button variant="ghost" size="sm" onClick={() => onEdit(invoice.id)} title="Edytuj fakturę">
              <Edit className="h-4 w-4" />
            </Button>

            {/* Delete */}
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)} title="Usuń fakturę">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

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
