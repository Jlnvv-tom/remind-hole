import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import zhCN, { type LocaleKey } from "./locales/zh-CN";
import enUS from "./locales/en-US";

type Locale = "zh-CN" | "en-US";

const LOCALES: Record<Locale, Record<LocaleKey, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

interface I18nContextValue {
  locale: Locale;
  t: (key: LocaleKey, params?: Record<string, string | number>) => string;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Persist locale preference in localStorage
const STORAGE_KEY = "blackhole-locale";

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en-US" || saved === "zh-CN") return saved;
  } catch {}
  // Detect browser language
  const browserLang = navigator.language || "zh-CN";
  return browserLang.startsWith("zh") ? "zh-CN" : "en-US";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  const t = useCallback(
    (key: LocaleKey, params?: Record<string, string | number>): string => {
      let text = LOCALES[locale][key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "zh-CN" ? "en-US" : "zh-CN";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
