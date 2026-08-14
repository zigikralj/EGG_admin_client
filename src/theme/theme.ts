import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark' = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: '#4caf50',
            light: '#81c784',
            dark: '#2e7d32',
            contrastText: '#ffffff',
          }
        : {
            main: '#2e7d32',
            light: '#4caf50',
            dark: '#1b5e20',
            contrastText: '#ffffff',
          },
      secondary: isDark
        ? {
            main: '#34d399',
            light: '#6ee7b7',
            dark: '#059669',
            contrastText: '#000000',
          }
        : {
            main: '#16a34a',
            light: '#4ade80',
            dark: '#15803d',
            contrastText: '#ffffff',
          },
      background: isDark
        ? {
            default: '#0b130e',
            paper: '#132018',
          }
        : {
            default: '#f4f6f8',
            paper: '#ffffff',
          },
      text: isDark
        ? {
            primary: '#f0f7f2',
            secondary: '#9ec1a3',
          }
        : {
            primary: '#1b2c22',
            secondary: '#516758',
          },
      status: isDark
        ? {
            active: '#4caf50',
            done: '#34d399',
            stale: '#fb923c',
            sampled: '#c084fc',
          }
        : {
            active: '#2e7d32',
            done: '#16a34a',
            stale: '#ed6c02',
            sampled: '#9c27b0',
          },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isDark
              ? '0px 1px 3px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3)'
              : '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0px 2px 4px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3)'
              : '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 1px 2px rgba(0, 0, 0, 0.06)',
            border: isDark ? '1px solid #1c3024' : '1px solid #e2e8f0',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            backgroundColor: isDark ? '#0d1711' : '#f8fafc',
            color: isDark ? '#9ec1a3' : '#475569',
            borderBottom: isDark ? '1px solid #1c3024' : '1px solid #e2e8f0',
          },
          body: {
            borderBottom: isDark ? '1px solid #18281e' : '1px solid #f1f5f9',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
    },
  });
};

export const theme = getTheme('light');

declare module '@mui/material/styles' {
  interface Palette {
    status: {
      active: string;
      done: string;
      stale: string;
      sampled: string;
    };
  }
  interface PaletteOptions {
    status?: {
      active: string;
      done: string;
      stale: string;
      sampled: string;
    };
  }
}
