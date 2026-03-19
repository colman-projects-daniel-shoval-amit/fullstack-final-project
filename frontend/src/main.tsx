import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import { SideNavProvider } from '@/context/SideNavContext';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SideNavProvider>
          <App />
        </SideNavProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
