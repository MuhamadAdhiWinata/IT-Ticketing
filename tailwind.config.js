/** @type {import('tailwindcss').Config} */

// Token tema disimpan sebagai hex (var(--color-*)). Modifikasi alpha Tailwind
// (bg-primary/5) butuh <alpha-value>; color-mix membaca nilai var saat runtime,
// jadi varian transparan tetap mengikuti merek perusahaan & mode gelap.
const alpha = (token) =>
  `color-mix(in srgb, var(${token}) calc(<alpha-value> * 100%), transparent)`;

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // `border`/`divide` tanpa warna harus ikut mode tema (bawaan v3: gray-200 statis di
      // kedua mode sehingga tampak putih di dark). divideColor Turunan dari borderColor.
      borderColor: { DEFAULT: alpha("--color-border") },
      colors: {
        primary: {
          DEFAULT: alpha("--color-primary"),
          hover: alpha("--color-primary-hover"),
          active: alpha("--color-primary-active"),
          muted: alpha("--color-primary-muted"),
          foreground: alpha("--color-primary-foreground"),
        },
        secondary: {
          DEFAULT: alpha("--color-secondary"),
          hover: alpha("--color-secondary-hover"),
          foreground: alpha("--color-secondary-foreground"),
        },
        accent: {
          DEFAULT: alpha("--color-accent"),
          foreground: alpha("--color-accent-foreground"),
        },
        background: alpha("--color-background"),
        foreground: alpha("--color-foreground"),
        surface: {
          DEFAULT: alpha("--color-surface"),
          elevated: alpha("--color-surface-elevated"),
        },
        muted: {
          DEFAULT: alpha("--color-muted"),
          foreground: alpha("--color-muted-foreground"),
        },
        border: {
          DEFAULT: alpha("--color-border"),
          strong: alpha("--color-border-strong"),
        },
        input: alpha("--color-input"),
        destructive: {
          DEFAULT: alpha("--color-destructive"),
          hover: alpha("--color-destructive-hover"),
          foreground: alpha("--color-destructive-foreground"),
        },
        success: {
          DEFAULT: alpha("--color-success"),
          muted: alpha("--color-success-muted"),
          foreground: alpha("--color-success-foreground"),
        },
        warning: {
          DEFAULT: alpha("--color-warning"),
          muted: alpha("--color-warning-muted"),
          foreground: alpha("--color-warning-foreground"),
        },
        info: {
          DEFAULT: alpha("--color-info"),
          muted: alpha("--color-info-muted"),
          foreground: alpha("--color-info-foreground"),
        },
        status: {
          draft: alpha("--color-status-draft"),
          process: alpha("--color-status-process"),
          delegasi: alpha("--color-status-delegasi"),
          selesai: alpha("--color-status-selesai"),
        },
        priority: {
          low: alpha("--color-priority-low"),
          medium: alpha("--color-priority-medium"),
          high: alpha("--color-priority-high"),
          critical: alpha("--color-priority-critical"),
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      zIndex: {
        dropdown: '50',
        sticky: '20',
        'modal-backdrop': '9990',
        modal: '9999',
      },
    },
  },
  plugins: [],
}