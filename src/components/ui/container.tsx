import * as React from "react";

import { cn } from "@/lib/utils";

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="container" className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

function Stack({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="stack" className={cn("flex flex-col gap-4", className)} {...props} />;
}

export { Container, Stack };
