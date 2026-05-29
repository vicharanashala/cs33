import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <Toaster position="top-right" />
            <App />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);