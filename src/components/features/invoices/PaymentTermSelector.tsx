import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, addMonths } from "date-fns";

interface PaymentTermSelectorProps {
  issueDate: Date;
  dueDate?: Date;
  paymentTermDays?: number | 'immediate' | 'custom' | 'month';
  onChange: (dueDate: Date, paymentTermDays: number | 'immediate' | 'custom' | 'month') => void;
}

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'natychmiast' },
  { value: '1', label: '1 dzień' },
  { value: '3', label: '3 dni' },
  { value: '5', label: '5 dni' },
  { value: '7', label: '7 dni' },
  { value: '14', label: '14 dni' },
  { value: '21', label: '21 dni' },
  { value: '30', label: '30 dni' },
  { value: '45', label: '45 dni' },
  { value: '60', label: '60 dni' },
  { value: '75', label: '75 dni' },
  { value: '90', label: '90 dni' },
  { value: 'month', label: '1 miesiąc' },
  { value: 'custom', label: 'wybrana data' },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function PaymentTermSelector({ issueDate, dueDate, paymentTermDays, onChange }: PaymentTermSelectorProps) {
  const handlePaymentTermChange = (value: string) => {
    let newDueDate: Date;
    let newPaymentTermDays: number | 'immediate' | 'custom' | 'month';

    if (value === 'immediate') {
      newDueDate = issueDate;
      newPaymentTermDays = 'immediate';
    } else if (value === 'custom') {
      newDueDate = dueDate || addDays(issueDate, 7);
      newPaymentTermDays = 'custom';
    } else if (value === 'month') {
      newDueDate = addMonths(issueDate, 1);
      newPaymentTermDays = 'month';
    } else {
      const days = parseInt(value, 10);
      newDueDate = addDays(issueDate, days);
      newPaymentTermDays = days;
    }

    onChange(newDueDate, newPaymentTermDays);
  };

  const handleCustomDateChange = (dateStr: string) => {
    const newDate = new Date(dateStr);
    onChange(newDate, 'custom');
  };

  // Determine current value for the select
  const selectValue =
    paymentTermDays === 'immediate' ? 'immediate' :
    paymentTermDays === 'custom' ? 'custom' :
    paymentTermDays === 'month' ? 'month' :
    String(paymentTermDays || '7');

  return (
    <div className="space-y-2">
      <Label htmlFor="payment-term">Termin płatności</Label>
      <Select value={selectValue} onValueChange={handlePaymentTermChange}>
        <SelectTrigger id="payment-term">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_TERMS.map((term) => (
            <SelectItem key={term.value} value={term.value}>
              {term.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show date picker when 'wybrana data' is selected */}
      {paymentTermDays === 'custom' && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="custom-due-date" className="text-xs text-muted-foreground">
            Wybierz datę terminu płatności
          </Label>
          <Input
            id="custom-due-date"
            type="date"
            value={dueDate ? formatDate(dueDate) : formatDate(addDays(issueDate, 7))}
            onChange={(e) => handleCustomDateChange(e.target.value)}
            min={formatDate(issueDate)}
          />
        </div>
      )}

      {/* Show calculated due date for non-custom selections */}
      {paymentTermDays !== 'custom' && dueDate && (
        <p className="text-xs text-muted-foreground">
          Termin: {dueDate.toLocaleDateString('pl-PL')}
        </p>
      )}
    </div>
  );
}
