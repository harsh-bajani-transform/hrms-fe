import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  placeholder = "Select...",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative flex items-center bg-white rounded-lg border transition-all w-full px-3 py-2.5 outline-none
          ${disabled 
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' 
            : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
        `}
      >
        {Icon && <Icon className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />}
        <span className="text-sm font-medium text-slate-700 flex-1 text-left truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              No options available
            </div>
          ) : (
            options.map((option, idx) => (
              <button
                key={option.value ?? idx}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
                  transition-colors hover:bg-blue-50
                  ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}
                `}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
