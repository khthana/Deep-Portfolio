import React, { useMemo } from "react";
import type { PortfolioTheme } from "./types";
import { ThemeContext } from "./theme-context.shared";

const defaultTheme: Required<PortfolioTheme> = {
  primaryColor: "#1a2a5d",
  secondaryColor: "#f4632a",
  backgroundColor: "#f5f5f5",
  cardColor: "#ffffff",
  textMainColor: "#1a2a5d",
  textSubColor: "#7c7c7c",
};

interface ThemeProviderProps {
  theme?: PortfolioTheme;
  children: React.ReactNode;
  wrapperClassName?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme,
  children,
  wrapperClassName,
}) => {
  const mergedTheme = useMemo<Required<PortfolioTheme>>(
    () => ({
      primaryColor: theme?.primaryColor ?? defaultTheme.primaryColor,
      secondaryColor: defaultTheme.secondaryColor,
      backgroundColor: defaultTheme.backgroundColor,
      cardColor: defaultTheme.cardColor,
      textMainColor: defaultTheme.textMainColor,
      textSubColor: defaultTheme.textSubColor,
    }),
    [theme]
  );

  const cssVariables = useMemo<React.CSSProperties>(
    () =>
      ({
        // Base CSS variables
        "--port-primary": mergedTheme.primaryColor,
        "--port-secondary": mergedTheme.secondaryColor,
        "--port-bg": mergedTheme.backgroundColor,
        "--port-card": mergedTheme.cardColor,
        "--port-text-main": mergedTheme.textMainColor,
        "--port-text-sub": mergedTheme.textSubColor,
        // Tailwind color variables 
        "--color-port-primary": mergedTheme.primaryColor,
        "--color-port-secondary": mergedTheme.secondaryColor,
        "--color-port-bg": mergedTheme.backgroundColor,
        "--color-port-card": mergedTheme.cardColor,
        "--color-port-text-main": mergedTheme.textMainColor,
        "--color-port-text-sub": mergedTheme.textSubColor,
      } as React.CSSProperties),
    [mergedTheme]
  );

  const value = useMemo(
    () => ({
      theme: mergedTheme,
      cssVariables,
    }),
    [mergedTheme, cssVariables]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div style={cssVariables} className={wrapperClassName}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

