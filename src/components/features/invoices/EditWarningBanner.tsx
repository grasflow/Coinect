import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { EditWarningBannerProps } from "./types";

const STORAGE_KEY = "invoice-edit-warning-dismissed";

export function EditWarningBanner({ onDismiss }: EditWarningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sprawdzenie czy banner został już zamknięty w tej sesji
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!wasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert variant="default" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Uwaga</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          Edycja faktury po wygenerowaniu może prowadzić do rozbieżności księgowych. Zalecamy tworzenie faktury
          korygującej dla istotnych zmian.
        </span>
        <Button variant="outline" size="sm" onClick={handleDismiss}>
          Rozumiem
        </Button>
      </AlertDescription>
    </Alert>
  );
}
