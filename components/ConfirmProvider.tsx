"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm은 ConfirmProvider 내부에서 사용되어야 합니다");
  return context.confirm;
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>(() => () => { });

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    resolveCallback(value);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-strong rounded-2xl shadow-2xl w-full max-w-sm p-6 mt-[-10vh] animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-display font-bold mb-3 text-text-primary flex items-center gap-2">
              {options.title}
            </h2>
            {options.description && (
              <p className="text-sm text-text-secondary mb-6 whitespace-pre-line leading-relaxed">
                {options.description}
              </p>
            )}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2.5 text-sm font-medium border border-border-subtle text-text-secondary rounded-xl hover:bg-elevated hover:text-text-primary transition-colors focus:ring-2 focus:ring-border-strong cursor-pointer"
                autoFocus
              >
                {options.cancelText || "취소"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:ring-2 cursor-pointer ${options.destructive
                    ? "bg-error/10 text-error hover:bg-error/20 border border-error/20 focus:ring-error/30"
                    : "bg-accent text-black hover:bg-accent-hover focus:ring-accent"
                  }`}
              >
                {options.confirmText || "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
