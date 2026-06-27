import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo Accent
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Emerald Accent
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0b0f19', // Deep dark slate background
      paper: '#111827',   // Slate secondary panel
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
      disabled: '#4b5563',
    },
    divider: '#1f2937',
    info: {
      main: '#0ea5e9', // Sky blue
    },
    warning: {
      main: '#f59e0b', // Amber
    },
    error: {
      main: '#ef4444', // Red rose
    },
    success: {
      main: '#10b981', // Emerald success
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.25)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(16, 185, 129, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.5)',
            borderColor: '#374151',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#1f2937',
          color: '#f3f4f6',
          fontWeight: 600,
        },
        root: {
          borderBottom: '1px solid #1f2937',
        },
      },
    },
  },
});

export default theme;
