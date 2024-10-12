/** @type {import('tailwindcss').Config} */
const config = {
    content: [
      './src/**/*.{html,js,svelte,ts,astro}',
    ],
  
    plugins: [
      require('tailwindcss-animated'),
      require('@tailwindcss/typography'),
    ],
  
    darkMode: 'class',
  
    theme: {
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
        '3xl': '1920px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif']
      },
      extend: {
        width: {
          '1/7': '14.2857143%',
          '1/2-screen': '50vh',
          '3/4-screen': '75vh',
          '4/5-screen': '80vh',
          '9/10-screen': '90vh'
        },
        height: {
          '1/2-screen': '50vh',
          '3/4-screen': '75vh',
          '4/5-screen': '80vh',
          '9/10-screen': '90vh'
        },
        maxHeight: {
          18: '4.2rem',
          '3/4-screen': '75vh'
        },
        maxWidth: {
          '6/12': '50%',
          '9/12': '75%',
          '10/12': '83.33%'
        },
        colors: {
          // Execify colors
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#92c4fe',
            400: '#5fa4fb',
            500: '#3a81f7',
            600: '#2965ed',
            700: '#1c4cd9',
            800: '#1d3eb0',
            900: '#1d398b',
            950: '#172554'
          },
          danger: {
            50: '#fff1f0',
            100: '#ffdedd',
            200: '#ffc2c0',
            300: '#ff9894',
            400: '#ff5d57',
            500: '#ff2b23',
            600: '#ff1d15',
            700: '#d70700',
            800: '#b10903',
            900: '#920f0a',
            950: '#500300'
          },
          info: {
            50: '#edfcf6',
            100: '#d3f8e8',
            200: '#aaf0d6',
            300: '#73e2bf',
            400: '#3acda3',
            500: '#17b890',
            600: '#0a9172',
            700: '#08745e',
            800: '#095c4c',
            900: '#094b3f',
            950: '#042a24'
          },
          night: {
            DEFAULT: '#03120e'
          },
          background: {
            DEFAULT: '#FAFFFD',
            calendar: '#f0f0f0'
          }
        }
      }
    }
  };
  
  module.exports = config;
  