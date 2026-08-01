"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string | undefined;
  onChange: (val: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
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
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === undefined || value === null || value === "") return "";
    return String(value);
  });

  const isFocusedRef = useRef(false);

  useEffect(() => {
    // While the user is focused/typing inside the input, do NOT overwrite their display string
    if (isFocusedRef.current) return;

    if (value === undefined || value === null || value === "") {
      setDisplayValue("");
    } else {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      const currentNum = parseFloat(displayValue);
      if (displayValue === "" || isNaN(currentNum) || currentNum !== num) {
        setDisplayValue(String(value));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string or single minus so user can clear input / remove last digit freely
    if (raw === "" || raw === "-") {
      setDisplayValue(raw);
      onChange(0);
      return;
    }

    // Filter pattern: allow digits and optional decimal point
    const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;

    if (regex.test(raw)) {
      setDisplayValue(raw);
      const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    if (displayValue === "" || isNaN(parseFloat(displayValue))) {
      if (min !== undefined && min > 0) {
        setDisplayValue(String(min));
        onChange(min);
      }
    } else {
      const parsed = parseFloat(displayValue);
      if (min !== undefined && parsed < min) {
        setDisplayValue(String(min));
        onChange(min);
      } else if (max !== undefined && parsed > max) {
        setDisplayValue(String(max));
        onChange(max);
      }
    }
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <Input
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      pattern="[0-9]*"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        "text-base md:text-sm placeholder:text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        className
      )}
      {...props}
    />
  );
}
