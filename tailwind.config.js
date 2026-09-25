/** @type {import('tailwindcss').Config} */
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
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          muted: 'var(--color-primary-muted)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          foreground: 'var(--color-secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        input: 'var(--color-input)',
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          hover: 'var(--color-destructive-hover)',
          foreground: 'var(--color-destructive-foreground)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          muted: 'var(--color-success-muted)',
          foreground: 'var(--color-success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          muted: 'var(--color-warning-muted)',
          foreground: 'var(--color-warning-foreground)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          muted: 'var(--color-info-muted)',
          foreground: 'var(--color-info-foreground)',
        },
        status: {
          draft: 'var(--color-status-draft)',
          process: 'var(--color-status-process)',
          delegasi: 'var(--color-status-delegasi)',
          selesai: 'var(--color-status-selesai)',
        },
        priority: {
          low: 'var(--color-priority-low)',
          medium: 'var(--color-priority-medium)',
          high: 'var(--color-priority-high)',
          critical: 'var(--color-priority-critical)',
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
