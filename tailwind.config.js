/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: '#0b0706', roast: '#16100d', cocoa: '#2a1710', cream: '#f4e7d3',
        caramel: '#d9953f', gold: '#e9b866', amber: '#ffb347',
      },
      fontFamily: {
        display: ['Anton', 'Noto Sans Thai', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        body: ['Inter', 'Noto Sans Thai', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
