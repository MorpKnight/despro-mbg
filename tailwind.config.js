/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // 1. Definisikan Palet Warna Kustom
      colors: {
        primary: '#4CAF50',        // GREEN: Core identity, buttons, headers
        secondary: '#1976D2',      // BLUE: Support elements, menus
        'accent-yellow': '#FBC02D',// YELLOW: CTAs, notifications, charts
        'accent-red': '#E53935',    // RED: Alerts, critical notifications
        'neutral-white': '#FFFFFF',// WHITE: Background for cards, text
        'neutral-gray': '#F5F5F5', // GRAY: Main app background
      },

      // 2. Definisikan Font Family
      fontFamily: {
        // Gunakan nama 'sans' sebagai default untuk kemudahan
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },

      // 3. Definisikan Ukuran Font Sesuai Aturan
      fontSize: {
        body: '16px',         // min. 16px body
        heading: '22px',      // 20-24px for headings
      },

      // 4. Aturan Tambahan untuk Card-based UI
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}