import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PenSquare, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

export function Navbar({ children }: { children?: ReactNode }) {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const email = (() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email as string | null;
    } catch {
      return null;
    }
  })();

  async function handleLogout() {
    await logout();
    navigate('/auth');
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Inkwell
        </Link>
        <div className="flex items-center gap-3">
          {children ?? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/posts/new">
                <PenSquare className="w-4 h-4 mr-1" />
                Write
              </Link>
            </Button>
          )}
          {email && (
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium select-none">
              {email[0].toUpperCase()}
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
