"use client";

interface SelectFilterProps {
  options: string[];
  activeValue: string;
  onChange: (val: string) => void;
  labelAll?: string;
  formatOption?: (val: string) => string;
  className?: string;
}

export function SelectFilter({ 
  options, 
  activeValue, 
  onChange, 
  labelAll = "All",
  formatOption = (val) => val,
  className = "min-w-32"
}: SelectFilterProps) {
  if (options.length === 0) return null;

  return (
    <select
      className={`bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer ${className}`}
      value={activeValue}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{labelAll}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {formatOption(opt)}
        </option>
      ))}
    </select>
  );
}
