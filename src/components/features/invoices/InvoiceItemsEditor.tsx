import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus } from "lucide-react";
import type { InvoiceItemsEditorProps, InvoiceItemViewModel } from "./types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const InvoiceItemsEditor = memo(function InvoiceItemsEditor({
  items,
  onChange,
  editable = true,
}: InvoiceItemsEditorProps) {
  const totalNet = useMemo(() => {
    return items.reduce((sum, item) => sum + item.netAmount, 0);
  }, [items]);

  const handleDescriptionChange = (index: number, description: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], description, isModified: true };
    onChange(updated);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    const updated = [...items];
    const qty = parseFloat(quantity) || 0;
    updated[index] = {
      ...updated[index],
      quantity: qty,
      netAmount: qty * updated[index].unitPrice,
      isModified: true,
    };
    onChange(updated);
  };

  const handleUnitPriceChange = (index: number, unitPrice: string) => {
    const updated = [...items];
    const price = parseFloat(unitPrice) || 0;
    updated[index] = {
      ...updated[index],
      unitPrice: price,
      netAmount: updated[index].quantity * price,
      isModified: true,
    };
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    // Przenumerowanie pozycji
    updated.forEach((item, i) => {
      item.position = i + 1;
    });
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItemViewModel = {
      position: items.length + 1,
      description: "",
      timeEntryIds: [],
      timeEntries: [],
      quantity: 0,
      unitPrice: 0,
      netAmount: 0,
      isModified: true,
    };
    onChange([...items, newItem]);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pozycje faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">Brak pozycji do wyświetlenia</p>
            {editable && (
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj pozycję
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pozycje faktury</CardTitle>
        {editable && (
          <Button variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj pozycję
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id || index} className="space-y-3 rounded-lg border bg-muted/30 p-4">
            {/* Nagłówek pozycji */}
            <div className="flex items-center gap-3">
              {editable && <GripVertical className="h-5 w-5 text-muted-foreground" />}
              <div className="flex-1 font-semibold">Pozycja {item.position}</div>
              {item.timeEntryIds.length > 0 && (
                <Badge variant="secondary">{item.timeEntryIds.length} wpisów czasu</Badge>
              )}
              {editable && (
                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Lista powiązanych wpisów czasu */}
            {item.timeEntries.length > 0 && (
              <div className="rounded-md bg-background/50 p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Powiązane wpisy czasu:</div>
                <div className="space-y-1">
                  {item.timeEntries.map((entry) => (
                    <div key={entry.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("pl-PL")} - {entry.description}
                      </span>
                      <span>
                        {entry.hours} godz. × {entry.hourly_rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edycja opisu */}
            <div className="space-y-2">
              <Label htmlFor={`description-${index}`}>Opis usługi</Label>
              <Input
                id={`description-${index}`}
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder="Np. Usługi programistyczne"
                disabled={!editable}
              />
            </div>

            {/* Ilość, stawka i kwota */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`quantity-${index}`}>Ilość (godz.)</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  step="0.25"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  disabled={!editable}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`unit-price-${index}`}>Stawka</Label>
                <Input
                  id={`unit-price-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                  disabled={!editable}
                />
              </div>

              <div className="space-y-2">
                <Label>Wartość netto</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted px-3 font-semibold">
                  {formatCurrency(item.netAmount)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Suma netto */}
        <div className="flex justify-between border-t pt-4 text-base md:text-lg font-semibold">
          <span>Suma netto:</span>
          <span>{formatCurrency(totalNet)}</span>
        </div>
      </CardContent>
    </Card>
  );
});
