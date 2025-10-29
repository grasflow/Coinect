import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { formatHoursToHumanReadable } from "@/lib/utils";

interface HoursDisplayProps {
  hours: number | string;
  className?: string;
}

export function HoursDisplay({ hours, className = "" }: HoursDisplayProps) {
  const numericHours = typeof hours === "string" ? parseFloat(hours) : hours;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>{formatHoursToHumanReadable(numericHours)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{numericHours.toFixed(2)}h</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
