import { PageLayout } from '@/components/PageLayout';
import { useAuth } from '@/context/AuthContext';

export function ProfilePage() {
  const { token } = useAuth();

  const email = (() => {
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email as string;
    } catch {
      return '';
    }
  })();

  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold select-none">
            {email ? email[0].toUpperCase() : '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{email}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">InkWall member</p>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
