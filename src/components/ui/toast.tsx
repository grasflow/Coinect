import * as React from "react";

import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  title?: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const show = React.useCallback((t: Omit<Toast, "id">) => {
    const id = idRef.current++;
    setToasts((s) => [...s, { id, ...t }]);
    setTimeout(() => dismiss(id), 4000);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((s) => s.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-[100] mx-auto flex w-full max-w-sm flex-col gap-2 px-3 sm:top-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-xl border bg-background/90 p-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70"
            )}
          >
            {t.title ? <div className="text-sm font-medium">{t.title}</div> : null}
            {t.description ? <div className="text-muted-foreground text-xs">{t.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export { ToastProvider, useToast };
