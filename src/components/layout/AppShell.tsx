import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-page-scroll">
      <div className="app-page">{children}</div>
      <BottomNavigation />
    </div>
  );
}
