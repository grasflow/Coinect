import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import type { ManualItem } from "./types";

interface ManualItemsEditorProps {
  items: ManualItem[];
  onChange: (items: ManualItem[]) => void;
}

/**
 * Komponent do ręcznego tworzenia pozycji faktury
 */
export function ManualItemsEditor({ items, onChange }: ManualItemsEditorProps) {
  // Dodaj nową pozycję
  const addItem = () => {
    const newItem: ManualItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      netAmount: 0,
    };
    onChange([...items, newItem]);
  };

  // Usuń pozycję
  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  // Aktualizuj pozycję
  const updateItem = (id: string, field: keyof ManualItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Automatycznie przelicz netAmount przy zmianie quantity lub unitPrice
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.netAmount = updatedItem.quantity * updatedItem.unitPrice;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Pozycje faktury</CardTitle>
        <Button onClick={addItem} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj pozycję
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Brak pozycji. Kliknij &quot;Dodaj pozycję&quot;, aby rozpocząć.
          </div>
        ) : (
          items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                {/* Numer pozycji */}
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">Poz. {index + 1}</Label>
                </div>

                {/* Opis */}
                <div className="md:col-span-2">
                  <Label htmlFor={`description-${item.id}`} className="text-sm font-medium">
                    Opis usługi *
                  </Label>
                  <Input
                    id={`description-${item.id}`}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="np. Konsultacje IT"
                    className="mt-1"
                  />
                </div>

                {/* Ilość */}
                <div>
                  <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
                    Ilość *
                  </Label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>

                {/* Cena jednostkowa */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`unitPrice-${item.id}`} className="text-sm font-medium">
                      Cena jedn. *
                    </Label>
                    <Input
                      id={`unitPrice-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="100.00"
                      className="mt-1"
                    />
                  </div>

                  {/* Przycisk usuwania */}
                  <Button
                    onClick={() => removeItem(item.id)}
                    variant="outline"
                    size="sm"
                    className="mb-1"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Kwota netto */}
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Wartość netto:</span>
                  <span className="font-medium">{item.netAmount.toFixed(2)} PLN</span>
                </div>
              </div>
            </Card>
          ))
        )}

        {/* Podsumowanie */}
        {items.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center font-medium">
                <span>Suma netto:</span>
                <span>{items.reduce((sum, item) => sum + item.netAmount, 0).toFixed(2)} PLN</span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
