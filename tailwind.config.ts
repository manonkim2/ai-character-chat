import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
        },
      },
      colors: {
        // Text palette
        fontPrimary: "hsl(var(--font-primary))",
        fontSecondary: "hsl(var(--font-secondary))",
        fontTertiary: "hsl(var(--font-tertiary))",

        // Background palette
        bgPrimary: "hsl(var(--bg-primary))",
        bgSecondary: "hsl(var(--bg-secondary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Brand
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        primary: "hsl(var(--brand))",
        primaryForeground: "hsl(var(--brand-foreground))",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "64px",
      },
      fontSize: {
        "3xl": ["2.25rem", "3.5rem"],
        "2xl": ["1.75rem", "2.5rem"],
        xl: ["1.25rem", "1.625rem"],
        lg: ["1.125rem", "1.5rem"],
        base: ["1rem", "1.375rem"],
        sm: ["0.875rem", "1.25rem"],
        xs: ["0.75rem", "1.125rem"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
