"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface SearchableComboboxItem {
  value: string;
  label: string;
}

interface SearchableComboboxProps {
  items: SearchableComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Select an item...",
  className,
  disabled = false,
}: SearchableComboboxProps) {
  // Map string value (from parent) to the corresponding object for Base UI internal state
  const selectedItem = React.useMemo(() => {
    return items.find((i) => i.value === value) || null;
  }, [items, value]);

  return (
    <Combobox
      items={items}
      value={selectedItem}
      onValueChange={(val) => {
        // Pass only the string value back to the parent
        onValueChange(val?.value || "");
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear
        className={cn(
          "w-full bg-white border-slate-200 rounded h-11",
          className,
        )}
      />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.value}
              value={item}
              className="cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
