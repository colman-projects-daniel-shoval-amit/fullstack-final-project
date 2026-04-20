import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSideNav } from '@/context/SideNavContext';
import { Button } from '@/components/ui/button';
import { PenSquare, LogOut, Menu } from 'lucide-react';
import type { ReactNode } from 'react';

export function Navbar({ children }: { children?: ReactNode }) {
  const { logout, token } = useAuth();
  const { toggle } = useSideNav();
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
    <>
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 select-none">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3 C16 3, 8 13.5, 8 19.5 a8 8 0 0 0 16 0 C24 13.5, 16 3, 16 3 Z" fill="currentColor" className="text-foreground"/>
                <ellipse cx="13" cy="19" rx="2" ry="3" fill="white" opacity="0.25" transform="rotate(-20 13 19)"/>
              </svg>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-foreground">Ink</span><span className="text-muted-foreground font-light">Wall</span>
              </span>
            </Link>
          </div>
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
    </>
  );
}
