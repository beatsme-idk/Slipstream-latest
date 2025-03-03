import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { config } from './lib/wagmiConfig';
import App from './App.tsx';
import { ThemeProvider } from './ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiConfig config={config}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </WagmiConfig>
  </StrictMode>
);