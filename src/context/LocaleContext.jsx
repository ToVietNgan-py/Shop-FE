import React, { createContext, useState, useMemo } from "react";
import en from "../locales/en.json";
import vi from "../locales/vi.json";

const LOCALES = { en, vi };

export const LocaleContext = createContext({
    locale: "vi",
    setLocale: () => { },
    t: (k) => k
});

export function LocaleProvider({ children, defaultLocale = "vi" }) {
    const [locale, setLocale] = useState(defaultLocale);

    const t = (key) => {
        const dict = LOCALES[locale] || {};
        return key.split(".").reduce((o, i) => (o && o[i] !== undefined ? o[i] : null), dict) || key;
    };

    const value = useMemo(() => ({ locale, setLocale, t }), [locale]);

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export default LocaleProvider;
