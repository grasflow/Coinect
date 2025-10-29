import * as React from "react";

import { cn } from "@/lib/utils";

type NavbarProps = React.ComponentProps<"nav"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  title?: React.ReactNode;
};

function Navbar({ className, leading, trailing, title, ...props }: NavbarProps) {
  return (
    <nav
      data-slot="navbar"
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        {title ? <div className="truncate text-base font-semibold">{title}</div> : null}
      </div>
      <div className="ml-auto flex items-center gap-1.5">{trailing}</div>
    </nav>
  );
}

export { Navbar };
