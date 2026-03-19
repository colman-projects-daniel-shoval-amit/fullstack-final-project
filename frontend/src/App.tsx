import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '@/pages/AuthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { PostViewPage } from '@/pages/PostViewPage';
import { PostEditorPage } from '@/pages/PostEditorPage';
import { AuthGuard } from '@/components/AuthGuard';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/new" element={<PostEditorPage />} />
        <Route path="/posts/:id" element={<PostViewPage />} />
        <Route path="/posts/:id/edit" element={<PostEditorPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
