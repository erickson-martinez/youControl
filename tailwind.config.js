/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gray-900': 'rgba(var(--color-gray-900), <alpha-value>)',
        'gray-800': 'rgba(var(--color-gray-800), <alpha-value>)',
        'gray-700': 'rgba(var(--color-gray-700), <alpha-value>)',
        'gray-600': 'rgba(var(--color-gray-600), <alpha-value>)',
        'gray-400': 'rgba(var(--color-gray-400), <alpha-value>)',
        'gray-300': 'rgba(var(--color-gray-300), <alpha-value>)',
        'white': 'rgba(var(--color-text-main), <alpha-value>)',
        'green-accent': '#22c55e',
        'red-accent': '#ef4444',
        'blue-accent': '#3b82f6',
        'yellow-accent': '#eab308',
      }
    }
  },
  plugins: [],
}
