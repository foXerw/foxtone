import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
import 'foxtone/css/themes/foxtone-dark.css';
import 'foxtone/css/themes/arctic-light.css';
import 'foxtone/css/themes/arctic-dark.css';
import 'foxtone/css/themes/silver-light.css';
import 'foxtone/css/themes/silver-dark.css';
import 'foxtone/css/themes/fennec-light.css';
import 'foxtone/css/themes/fennec-dark.css';
import 'foxtone/css/themes/corsac-light.css';
import 'foxtone/css/themes/corsac-dark.css';
import 'foxtone/css/themes/grayfox-light.css';
import 'foxtone/css/themes/grayfox-dark.css';
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
