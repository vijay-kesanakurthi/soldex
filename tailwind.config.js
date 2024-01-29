/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        crimson: "crimson",
      },
      keyframes: {
        customBounce: {
          "0%": { transform: "translateY(0)" },
          "  50%": {
            transform: "translateY(-2.5rem)",
          },

          "100% ": {
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "bounce-slow": "bounce 6s linear infinite",
        "custom-bounce": "customBounce 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
