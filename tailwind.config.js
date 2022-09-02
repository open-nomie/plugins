module.exports = {
  content: ["./src/**/*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        current: "currentColor",
        "light-grey": "#E5EEE5",
        purple: "#7652C6",
        gray: {
          950: '#090C13',
        },
        primary: {
          DEFAULT: '#00A4E4',
          50: '#eff9ff',
          100: '#def1ff',
          200: '#b6e5ff',
          300: '#75d3ff',
          400: '#2cbdff',
          500: '#00aaff',
          600: '#0083d4',
          700: '#0068ab',
          800: '#00588d',
          900: '#064974',
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['hover', 'responsive', 'focus', 'dark'],
      textColor: ['hover', 'responsive', 'focus', 'dark'],
    },
  },
  plugins: [],
};

