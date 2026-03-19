import { PageLayout } from '@/components/PageLayout';

export function FollowingPage() {
  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Following</h1>
        <p className="text-muted-foreground text-sm">
          Authors you follow will appear here.
        </p>
      </main>
    </PageLayout>
  );
}
