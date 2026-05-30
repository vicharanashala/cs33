import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Toaster position="top-right" />
    <App />
  </ErrorBoundary>,
);