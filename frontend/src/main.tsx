import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import { UserProvider } from '@/context/UserContext';
import { SideNavProvider } from '@/context/SideNavContext';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <SideNavProvider>
            <App />
          </SideNavProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
