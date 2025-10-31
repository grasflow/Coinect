import * as React from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ label, helperText, errorText, required, htmlFor, children, className }: FormFieldProps) {
  const describedById = React.useId();

  // DEBUG: Log when FormField renders with an error
  React.useEffect(() => {
    if (errorText) {
      // eslint-disable-next-line no-console
      console.log(`⚠️ [FormField] Rendering error for ${htmlFor}:`, errorText);
    }
  }, [errorText, htmlFor]);

  return (
    <div data-slot="form-field" className={cn("grid gap-1.5", className)}>
      {label ? (
        <label data-slot="label" htmlFor={htmlFor} className={cn("text-sm font-medium")}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
      ) : null}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement, {
            ref: (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref,
            "aria-invalid": Boolean(errorText) || undefined,
            "aria-describedby": helperText || errorText ? describedById : undefined,
          })
        : children}

      {helperText && !errorText ? (
        <p id={describedById} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      ) : null}

      {errorText ? (
        <p id={describedById} className="text-destructive text-xs">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
