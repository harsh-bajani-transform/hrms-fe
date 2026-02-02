import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'

export type SelectValue = string | number

export interface SelectOption<TValue extends SelectValue> {
  value: TValue
  label: string
}

export interface CustomSelectProps<TValue extends SelectValue> {
  value: TValue | null
  onChange: (value: TValue) => void
  options: Array<SelectOption<TValue>>
  icon?: LucideIcon
  placeholder?: string
  className?: string
  disabled?: boolean
}

const CustomSelect = <TValue extends SelectValue>({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}: CustomSelectProps<TValue>) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = dropdownRef.current
      if (!el) return

      const target = event.target
      if (target instanceof Node && !el.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={`
          relative flex items-center bg-white rounded-lg border transition-all w-full px-3 py-2.5 outline-none cursor-pointer
          ${disabled
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
        `}
      >
        {Icon ? <Icon className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" /> : null}
        <span className="text-sm font-medium text-slate-700 flex-1 text-left truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm flex items-center justify-between cursor-pointer
                  transition-colors hover:bg-blue-50
                  ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}
                `}
              >
                <span>{option.label}</span>
                {value === option.value ? (
                  <Check className="w-4 h-4 text-blue-600" />
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export default CustomSelect
