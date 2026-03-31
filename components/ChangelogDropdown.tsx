"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { ReleaseEntry } from "@/lib/changelog";

interface ChangelogDropdownProps {
  releases: ReleaseEntry[];
  latestVersion: string;
}

const LS_KEY = "synapso_last_seen_version";

export default function ChangelogDropdown({
  releases,
  latestVersion,
}: ChangelogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Changelog");

  useEffect(() => {
    const lastSeen = localStorage.getItem(LS_KEY);
    setShowBadge(lastSeen !== latestVersion);
  }, [latestVersion]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      localStorage.setItem(LS_KEY, latestVersion);
      setShowBadge(false);
    }
  }

  if (releases.length === 0) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={t("title")}
        className="relative flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
      >
        {t("title")}
        {showBadge && (
          <span className="px-1 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-sm uppercase tracking-tight">
            {t("newBadge")}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border-subtle bg-canvas/95 backdrop-blur-md shadow-lg overflow-hidden z-50">
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {releases.map((release) => (
              <div key={release.version}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-semibold text-sm text-text-primary">
                    {release.version}
                  </span>
                  <span className="text-xs text-text-secondary">{release.date}</span>
                </div>
                {release.features.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-text-secondary mb-1">
                      🚀 {t("features")}
                    </p>
                    <ul className="space-y-0.5">
                      {release.features.map((f, i) => (
                        <li key={i} className="text-xs text-text-secondary">
                          • {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {release.fixes.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-text-secondary mb-1">
                      🐛 {t("fixes")}
                    </p>
                    <ul className="space-y-0.5">
                      {release.fixes.map((f, i) => (
                        <li key={i} className="text-xs text-text-secondary">
                          • {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {release.security.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-text-secondary mb-1">
                      🔒 {t("security")}
                    </p>
                    <ul className="space-y-0.5">
                      {release.security.map((s, i) => (
                        <li key={i} className="text-xs text-text-secondary">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border-subtle px-4 py-3">
            <Link
              href="/changelog"
              onClick={() => setIsOpen(false)}
              className="text-xs text-accent hover:text-accent-hover transition-colors font-medium"
            >
              {t("viewAll")} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
