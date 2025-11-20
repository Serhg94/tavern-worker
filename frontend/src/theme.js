import { createTheme } from '@mui/material/styles';

// Create a custom dark theme for the RPG application
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#10b981', // Emerald
            light: '#34d399',
            dark: '#059669',
        },
        background: {
            default: '#0f172a', // Slate 950
            paper: '#1e293b', // Slate 800
        },
        text: {
            primary: '#f1f5f9', // Slate 100
            secondary: '#94a3b8', // Slate 400
        },
        warning: {
            main: '#f59e0b', // Amber
        },
        error: {
            main: '#ef4444', // Red
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: '#334155', // Slate 700
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
    },
});

export default theme;
