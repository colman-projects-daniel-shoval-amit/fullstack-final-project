import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '@/pages/AuthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage';
import { AuthGuard } from '@/components/AuthGuard';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/" element={<div>Home (protected)</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
