import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => { }
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("theme") || "light";
        } catch (e) {
            return "light";
        }
    });

    useEffect(() => {
        const isDark = theme === "dark";
        document.documentElement.classList.toggle("theme-dark", isDark);
        document.documentElement.classList.toggle("theme-light", !isDark);
        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            // ignore
        }
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;
