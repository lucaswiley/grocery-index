import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: '#1bae70',
        text: {
          primary: '#1F2937',   // gray-800
          secondary: '#4B5563', // gray-600
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
