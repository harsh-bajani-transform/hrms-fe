import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Search, X, type LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isClearable?: boolean;
  error?: boolean;
  errorMessage?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  value, 
  onChange, 
  options = [], 
  icon: Icon, 
  placeholder = "Select...",
  className = "",
  disabled = false,
  isClearable = true,
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

  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value),
    [options, value]
  );

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
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
              !selectedOption && "text-slate-400"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {Icon && <Icon className="w-4 h-4 text-blue-600 shrink-0" />}
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {isClearable && value && !disabled && (
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
          <div className="flex flex-col max-h-72 overflow-hidden">
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 border-none focus-visible:ring-0 px-0 bg-transparent"
              />
            </div>
            <div className="overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={`${option.value}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors hover:bg-blue-50 hover:text-blue-700",
                        isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
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

export default SearchableSelect;
