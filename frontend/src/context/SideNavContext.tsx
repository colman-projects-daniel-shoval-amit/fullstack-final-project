import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SideNavContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SideNavContext = createContext<SideNavContextValue | null>(null);

export function SideNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => localStorage.getItem('sidenav') === 'open');

  function toggle() {
    setOpen(v => {
      const next = !v;
      localStorage.setItem('sidenav', next ? 'open' : 'closed');
      return next;
    });
  }

  function close() {
    setOpen(false);
    localStorage.setItem('sidenav', 'closed');
  }

  return (
    <SideNavContext.Provider value={{ open, toggle, close }}>
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  const ctx = useContext(SideNavContext);
  if (!ctx) throw new Error('useSideNav must be used inside SideNavProvider');
  return ctx;
}
