import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number; // 0-100
};

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-2 w-full rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
