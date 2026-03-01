import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Discord brand colors
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          bg: {
            primary: '#313338',
            secondary: '#2B2D31',
            tertiary: '#1E1F22',
            floating: '#111214',
            'chat-input': '#383A40',
          },
          text: {
            primary: '#F2F3F5',
            secondary: '#B5BAC1',
            muted: '#949BA4',
            link: '#00A8FC',
          },
          interactive: {
            normal: '#B5BAC1',
            hover: '#DBDEE1',
            active: '#FFFFFF',
            muted: '#4E5058',
          },
        },
        status: {
          online: '#23A559',
          idle: '#F0B232',
          dnd: '#F23F43',
          offline: '#80848E',
        },
        // shadcn/ui semantic tokens (map to CSS vars)
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        'sidebar-server': '72px',
        'sidebar-channel': '240px',
        'sidebar-member': '240px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
