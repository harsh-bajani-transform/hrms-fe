import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, X, CheckSquare, Square, type LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectOption } from './SearchableSelect';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectWithCheckboxProps {
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  options: SelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  error?: boolean;
  errorMessage?: string;
}

const MultiSelectWithCheckbox: React.FC<MultiSelectWithCheckboxProps> = ({ 
  value = [], 
  onChange, 
  options = [], 
  icon: Icon, 
  placeholder = "Select...",
  className = "",
  disabled = false,
  showSelectAll = true,
  error = false,
  errorMessage = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter(opt => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return opt.label?.toLowerCase().includes(searchLower) || 
             opt.value?.toString().toLowerCase().includes(searchLower);
    });
  }, [options, searchTerm]);

  const selectedOptions = useMemo(() => 
    options.filter(opt => value.includes(opt.value)),
    [options, value]
  );

  const allFilteredSelected = useMemo(() => 
    filteredOptions.length > 0 && filteredOptions.every(opt => value.includes(opt.value)),
    [filteredOptions, value]
  );

  const handleToggle = (optionValue: string | number) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredValues = filteredOptions.map(opt => opt.value);
      onChange(value.filter(v => !filteredValues.includes(v)));
    } else {
      const newValues = Array.from(new Set([...value, ...filteredOptions.map(opt => opt.value)]));
      onChange(newValues);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchTerm('');
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === 1 && selectedOptions[0]) return selectedOptions[0].label;
    return `${selectedOptions.length} items selected`;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-slate-50 font-medium border-slate-300 hover:bg-white hover:border-blue-500 hover:text-inherit shadow-xs h-10",
              error && "border-red-500 focus-visible:ring-red-200",
              selectedOptions.length === 0 && "text-slate-400"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {Icon && <Icon className="w-4 h-4 text-blue-600 shrink-0" />}
              <span className="truncate">
                {getDisplayText()}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {value.length > 0 && !disabled && (
                <X 
                  className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" 
                  onClick={handleClear}
                />
              )}
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
          <div className="flex flex-col max-h-96 overflow-hidden">
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 border-none focus-visible:ring-0 px-0 bg-transparent"
              />
            </div>

            {showSelectAll && filteredOptions.length > 0 && (
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Checkbox 
                    checked={allFilteredSelected} 
                    onCheckedChange={handleSelectAll}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
                  {filteredOptions.length < options.length && (
                    <span className="text-slate-400">({filteredOptions.length})</span>
                  )}
                </button>
              </div>
            )}

            <div className="overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div 
                      key={`${option.value}-${idx}`}
                      className={cn(
                        "w-full px-4 py-2 flex items-center gap-3 transition-colors hover:bg-slate-50 cursor-pointer",
                        isSelected && "bg-blue-50/50"
                      )}
                      onClick={() => handleToggle(option.value)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(option.value)}
                        className="pointer-events-none"
                      />
                      <span className={cn(
                        "text-sm truncate",
                        isSelected ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"
                      )}>
                        {option.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {selectedOptions.length > 0 && (
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 flex justify-between">
                <span>{selectedOptions.length} SELECTED</span>
                <span>/ {options.length} TOTAL</span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {error && errorMessage && (
        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default MultiSelectWithCheckbox;
