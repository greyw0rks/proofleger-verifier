import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'","Georgia","serif"],
        mono: ["'IBM Plex Mono'","monospace"],
        sans: ["'DM Sans'","system-ui","sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
