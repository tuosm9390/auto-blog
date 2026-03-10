import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
}

export function Checkbox({ checked, className = '' }: CheckboxProps) {
  return (
    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? "border-accent bg-accent" : "border-border-strong"} ${className}`}>
      {checked && <span className="text-black text-xs font-bold">✓</span>}
    </div>
  );
}
