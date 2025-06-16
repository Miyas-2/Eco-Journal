import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Modern Organik Color System
        organic: {
          'off-white': '#fefefe',
          'sage': {
            DEFAULT: '#9caf88',
            light: '#b8c9a5',
          },
          'sky': {
            DEFAULT: '#87ceeb',
            light: '#b0dff5',
          },
          'sun': {
            DEFAULT: '#ffd700',
            light: '#fff176',
          },
          'title': '#44403c', // stone-700
          'body': '#57534e', // stone-600
          'secondary': '#78716c', // stone-500
          'caption': '#78716c', // stone-500
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        organik: ['Poppins', 'Nunito Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gentle-bounce': 'gentle-bounce 0.6s ease-in-out',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
        'organic-float': 'organic-float 6s ease-in-out infinite',
        'trophy-shine': 'trophy-shine 2s ease-in-out infinite',
        'gentle-shake': 'gentle-shake 0.5s ease-in-out',
        'skeleton-wave': 'skeleton-wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'organic-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'trophy-shine': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.05) rotate(2deg)' },
        },
        'gentle-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-1px)' },
          '75%': { transform: 'translateX(1px)' },
        },
        'skeleton-wave': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'organic': '20px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;