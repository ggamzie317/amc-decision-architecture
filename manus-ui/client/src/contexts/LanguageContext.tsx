import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AmcLanguage = "ko" | "en" | "zh";

type LanguageContextValue = {
  language: AmcLanguage;
  setLanguage: (next: AmcLanguage) => void;
};

const STORAGE_KEY = "amc_language_v1";

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: unknown): AmcLanguage {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "ko" || v === "zh") {
    return v;
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AmcLanguage>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}

