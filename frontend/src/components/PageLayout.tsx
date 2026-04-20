import type { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { SideNav } from '@/components/SideNav';

export function PageLayout({ children, navbarChildren }: { children: ReactNode; navbarChildren?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar>{navbarChildren}</Navbar>
      <div className="flex">
        <SideNav />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
