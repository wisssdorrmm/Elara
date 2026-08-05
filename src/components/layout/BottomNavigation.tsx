import { NavLink } from 'react-router-dom';
import { Home, Calendar, Plus, Clock, User } from 'lucide-react';
import { cn } from '@/utils/cn';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/log', label: 'Log', icon: Plus, isCentral: true },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-app -translate-x-1/2 px-4 pb-4">
      <div className="flex items-center justify-between rounded-nav bg-white px-3 py-2.5 shadow-premium">
        {tabs.map(({ path, label, icon: Icon, isCentral }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition-colors',
                isCentral && 'relative -mt-6',
                isActive && !isCentral && 'text-primary',
                !isActive && !isCentral && 'text-text-muted'
              )
            }
          >
            {isCentral ? (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-soft">
                <Icon className="h-6 w-6" />
              </span>
            ) : (
              <>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
