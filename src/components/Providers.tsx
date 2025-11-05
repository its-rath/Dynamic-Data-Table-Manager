"use client";
import { PropsWithChildren, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { persistor, store } from '@/redux/store';

export default function Providers({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => {
    const common = {
      shape: { borderRadius: 8 },
      components: {
        MuiTableRow: { styleOverrides: { root: { transition: 'background-color 120ms ease' } } },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.02em',
            },
            body: {
              fontSize: '0.95rem',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
      },
    } as any;

    if (mode === 'dark') {
      return createTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#90caf9' },
          background: { default: '#0b0f13', paper: '#0f1720' },
          divider: 'rgba(255,255,255,0.08)',
        },
        ...common,
      });
    }

    return createTheme({
      palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        background: { default: '#f4f6f8', paper: '#ffffff' },
        divider: 'rgba(0,0,0,0.12)',
      },
      ...common,
    });
  }, [mode]);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* expose theme toggle via custom event */}
          <ThemeModeBridge onToggle={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))} />
          {children}
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

function ThemeModeBridge({ onToggle }: { onToggle: () => void }) {
  // Listen for a custom event from ThemeToggle component
  if (typeof window !== 'undefined') {
    (window as any).__toggle_theme = onToggle;
  }
  return null;
}


