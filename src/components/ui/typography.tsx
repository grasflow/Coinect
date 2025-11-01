import * as React from "react";

import { cn } from "@/lib/utils";

function H1({ className, children, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1 data-slot="h1" className={cn("text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2", className)} {...props}>
      {children}
    </h1>
  );
}

function H2({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 data-slot="h2" className={cn("text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

function H3({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 data-slot="h3" className={cn("text-lg md:text-xl lg:text-2xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

function Text({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="text" className={cn("text-sm md:text-base leading-7", className)} {...props} />;
}

function Muted({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="muted" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export { H1, H2, H3, Text, Muted };
