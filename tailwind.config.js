// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
   theme: {
    extend: {
      colors: {
        primary: "#4CAF50",      // Green - Core identity
        secondary: "#1976D2",    // Blue - Support elements
        accentYellow: "#FBC02D", // Yellow - Attention
        accentRed: "#E53935",    // Red - Alerts/Warnings
        neutralWhite: "#FFFFFF", // Background
        neutralGray: "#F5F5F5",  // Cards / Secondary BG
      },
      fontFamily: {
        regular: ["Roboto", "sans-serif"],
        bold: ["Roboto-Bold", "sans-serif"],
      },
      fontSize: {
        body: "16px",
        heading: "20px",
        title: "24px",
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        card: "1rem", // 2xl = 1rem in Tailwind scale
      },
      spacing: {
        containerX: "1rem", // px-4
        containerY: "0.5rem", // py-2
      },
    },
  },
  plugins: [],
};
