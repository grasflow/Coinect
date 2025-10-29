import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateRange =
  | {
      from: Date;
      to: Date;
    }
  | undefined;

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  id?: string;
}

export function DateRangePicker({ value, onChange, placeholder = "Wybierz zakres dat", id }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("w-[280px] justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "dd MMM yyyy", { locale: pl })} - {format(value.to, "dd MMM yyyy", { locale: pl })}
              </>
            ) : (
              format(value.from, "dd MMM yyyy", { locale: pl })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value ? { from: value.from, to: value.to } : undefined}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange({ from: range.from, to: range.to });
            } else if (range?.from) {
              onChange({ from: range.from, to: range.from });
            } else {
              onChange(undefined);
            }
          }}
          numberOfMonths={2}
          locale={pl}
        />
      </PopoverContent>
    </Popover>
  );
}
