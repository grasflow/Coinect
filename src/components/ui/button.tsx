import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // HIG: Filled (najsilniejszy)
        filled: "bg-primary text-primary-foreground shadow-none hover:bg-primary/90 active:bg-primary/85",
        // HIG: Tinted (lekki kolor tła z akcentem)
        tinted: "bg-accent text-foreground shadow-none hover:bg-accent/80 active:bg-accent/70",
        // HIG: Gray (neutralny przycisk wtórny)
        gray: "bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/80 active:bg-secondary/75",
        // HIG: Plain (bez tła, tylko ink)
        plain: "text-primary shadow-none hover:bg-accent hover:text-primary active:bg-accent/80",
        // Outline dla przypadków niskiej dominacji
        outline: "border border-input bg-transparent text-foreground shadow-none hover:bg-accent hover:text-foreground",
        // Destructive z czytelnym stanem
        destructive:
          "bg-destructive text-white shadow-none hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
      },
      size: {
        // HIG zaleca min 44px dla touch — przyjmujemy komfortowe wartości
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return <Comp ref={ref} data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
