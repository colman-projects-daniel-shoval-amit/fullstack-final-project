import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, BookOpen, Users, LogOut, PenSquare, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSideNav } from '@/context/SideNavContext';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/profile', icon: User, label: 'Profile', end: false },
  { to: '/my-posts', icon: BookOpen, label: 'My Posts', end: false },
  { to: '/following', icon: Users, label: 'Following', end: false },
  { to: '/messages', icon: MessageSquare, label: 'Messages', end: false },
  { to: '/posts/new', icon: PenSquare, label: 'Write', end: false },
];

export function SideNav() {
  const { token, logout } = useAuth();
  const { open } = useSideNav();
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
    <aside
      className="sticky top-14 self-start h-[calc(100vh-3.5rem)] border-r bg-background flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out shrink-0"
      style={{ width: open ? 240 : 0 }}
    >
      <div className="w-[240px] flex flex-col flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-foreground font-medium bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <Separator className="mb-4" />
          {email && (
            <div className="flex items-center gap-2.5 px-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                {email[0].toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground truncate">{email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
