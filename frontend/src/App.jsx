import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import theme from './theme';
import Home from './pages/Home';
import Game from './pages/Game';
import { LanguageProvider } from './lib/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:id" element={<Game />} />
            </Routes>
          </Box>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
