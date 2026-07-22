"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string | undefined;
  onChange: (val: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  allowDecimals = true,
  min,
  max,
  className,
  placeholder,
  ...props
}: NumberInputProps) {
  // Store internal string value to allow backspacing to empty string freely
  const [displayValue, setDisplayValue] = useState<string>(
    value === undefined || value === null ? "" : String(value)
  );

  useEffect(() => {
    // Sync external prop changes (e.g. standard size auto-fills) into display string
    if (value === undefined || value === null || value === "") {
      if (displayValue !== "") {
        const parsedCurrent = parseFloat(displayValue);
        if (parsedCurrent === 0) {
          setDisplayValue("");
        }
      }
    } else {
      const parsedProp = typeof value === "number" ? value : parseFloat(String(value));
      const parsedCurrent = parseFloat(displayValue);
      if (displayValue === "" || isNaN(parsedCurrent) || parsedCurrent !== parsedProp) {
        setDisplayValue(String(value));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string so user can clear the input completely
    if (raw === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    // Filter pattern: allow digits and at most one decimal point if enabled
    const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;

    if (regex.test(raw)) {
      setDisplayValue(raw);
      const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue === "" || isNaN(parseFloat(displayValue))) {
      if (min !== undefined) {
        setDisplayValue(String(min));
        onChange(min);
      }
    } else if (min !== undefined && parseFloat(displayValue) < min) {
      setDisplayValue(String(min));
      onChange(min);
    } else if (max !== undefined && parseFloat(displayValue) > max) {
      setDisplayValue(String(max));
      onChange(max);
    }
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <Input
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(className)}
      {...props}
    />
  );
}
