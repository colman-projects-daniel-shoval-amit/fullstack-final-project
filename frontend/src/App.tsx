import { Routes, Route, Navigate,useSearchParams } from 'react-router-dom';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AuthPage } from '@/pages/AuthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { PostViewPage } from '@/pages/PostViewPage';
import { PostEditorPage } from '@/pages/PostEditorPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MyPostsPage } from '@/pages/MyPostsPage';
import { FollowingPage } from '@/pages/FollowingPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AuthGuard } from '@/components/AuthGuard';
import { useUser } from '@/context/UserContext';

function OnboardingGuard() {
  const { profile, isLoadingProfile } = useUser();
  const [searchParams] = useSearchParams();
  if (isLoadingProfile) return null;
  if (profile && profile.interests.length > 0 && searchParams.get('edit') !== 'true')
    return <Navigate to="/" replace />;
  return <OnboardingPage />;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingGuard />} />
        <Route path="/posts/new" element={<PostEditorPage />} />
        <Route path="/posts/:id" element={<PostViewPage />} />
        <Route path="/posts/:id/edit" element={<PostEditorPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-posts" element={<MyPostsPage />} />
        <Route path="/following" element={<FollowingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
    </>
  );
}

export default App;
