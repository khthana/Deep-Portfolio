import React, { createContext, useContext } from "react";
import type { PortfolioTheme } from "./types";

export interface ThemeContextValue {
  theme: Required<PortfolioTheme>;
  cssVariables: React.CSSProperties;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
