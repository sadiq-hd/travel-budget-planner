/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js,jsx,tsx}",
    "./src/app/**/*.{html,ts}",
    "./src/app/components/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      // يمكن إضافة ألوان أو خطوط مخصصة هنا
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'sans-serif'],
      }
    },
  },
  plugins: [],
  // دعم RTL للعربية
  corePlugins: {
    // يمكن تخصيص المزيد حسب الحاجة
  }
}