import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  id: string;
  required?: boolean;
  placeholder?: string;
}

export function PasswordInput({
  value,
  onChange,
  error,
  label,
  id,
  required = false,
  placeholder = "••••••••",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-11 h-11"
        />
        <Button
          type="button"
          variant="plain"
          size="icon"
          onClick={togglePasswordVisibility}
          className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent focus-visible:ring-offset-0"
          aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
          )}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
