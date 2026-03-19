import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '@/pages/AuthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { PostViewPage } from '@/pages/PostViewPage';
import { PostEditorPage } from '@/pages/PostEditorPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MyPostsPage } from '@/pages/MyPostsPage';
import { FollowingPage } from '@/pages/FollowingPage';
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-posts" element={<MyPostsPage />} />
        <Route path="/following" element={<FollowingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
