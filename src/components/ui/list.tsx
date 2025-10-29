import * as React from "react";

import { cn } from "@/lib/utils";

function List({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="list" className={cn("divide-border rounded-xl border", className)} {...props} />;
}

type ListItemProps = React.ComponentProps<"li"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClick?: () => void;
};

function ListItem({ className, leading, trailing, title, subtitle, onClick, ...props }: ListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  if (onClick) {
    return (
      <div
        data-slot="list-item"
        className={cn(
          "group flex select-none items-center gap-3 p-3 outline-none transition-colors hover:bg-accent focus-visible:bg-accent cursor-pointer",
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        {...props}
      >
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          {title ? <div className="truncate text-sm font-medium">{title}</div> : null}
          {subtitle ? <div className="text-muted-foreground truncate text-xs">{subtitle}</div> : null}
        </div>
        {trailing ? <div className="ml-2 shrink-0">{trailing}</div> : null}
      </div>
    );
  }

  return (
    <li
      data-slot="list-item"
      className={cn(
        "group flex select-none items-center gap-3 p-3 outline-none transition-colors hover:bg-accent focus-visible:bg-accent cursor-default",
        className
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        {title ? <div className="truncate text-sm font-medium">{title}</div> : null}
        {subtitle ? <div className="text-muted-foreground truncate text-xs">{subtitle}</div> : null}
      </div>
      {trailing ? <div className="ml-2 shrink-0">{trailing}</div> : null}
    </li>
  );
}

export { List, ListItem };
