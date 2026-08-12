import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, Heart, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { LOG_ACTIONS } from '@/constants/logActions';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
];

const trailingTabs = [
  { path: '/insights', label: 'Insights', icon: Sparkles },
  { path: '/couple', label: 'Couple', icon: Heart },
];

function NavTab({ path, label, icon: Icon }: { path: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={path}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition-colors',
          isActive ? 'text-primary' : 'text-text-muted'
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export function BottomNavigation() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-app -translate-x-1/2 px-4 pb-4">
        <div className="flex items-center justify-between rounded-nav bg-white px-3 py-2.5 shadow-premium">
          {tabs.map((tab) => (
            <NavTab key={tab.path} {...tab} />
          ))}

          <div className="relative -mt-6 flex flex-1 justify-center">
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Log"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-soft"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {trailingTabs.map((tab) => (
            <NavTab key={tab.path} {...tab} />
          ))}
        </div>
      </nav>

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="What would you like to log?">
        <div className="space-y-2">
          {LOG_ACTIONS.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => {
                setSheetOpen(false);
                navigate(path);
              }}
              className="flex w-full items-center gap-3 rounded-input border border-gray-200 bg-white px-4 py-3.5 text-left hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="font-medium text-text">{label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
