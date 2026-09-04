import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
import 'foxtone/css/themes/foxtone-dark.css';
import 'foxtone/css/themes/ocean-light.css';
import 'foxtone/css/themes/ocean-dark.css';
import './styles.css';
import { FoxThemeProvider } from 'foxtone-react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FoxThemeProvider storageKey="foxtone-playground">
      <App />
    </FoxThemeProvider>
  </StrictMode>,
);
