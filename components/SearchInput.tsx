"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface SearchInputProps {
  initialValue: string;
  onSearch: (value: string) => void;
}

export default function SearchInput({ initialValue, onSearch }: SearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const t = useTranslations("Search");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-tertiary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full bg-surface-subtle border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all text-text-primary"
      />
    </div>
  );
}
