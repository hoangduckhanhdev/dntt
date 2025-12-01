// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f97316",
        primaryLight: "#fef3e7",
        accent: "#fb923c",
        dark: "#1e293b",
        muted: "#64748b",
        border: "#e2e8f0",
      },

      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.06)",
      },

      keyframes: {
        zaloWiggle: {
          "0%": { transform: "translateX(0)" },
          "10%": { transform: "translateX(-4px)" },
          "20%": { transform: "translateX(4px)" },
          "30%": { transform: "translateX(-3px)" },
          "40%": { transform: "translateX(3px)" },
          "50%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(0)" },
        },
      },

      animation: {
        zaloWiggle: "zaloWiggle 0.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
