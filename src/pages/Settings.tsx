import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Bell, Globe, DatabaseBackup, Download, Trash2, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Dialog } from '@/components/ui/Dialog';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { notify } from '@/utils/toast';
import { requestNotificationPermission } from '@/utils/notifications';
import { cn } from '@/utils/cn';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export default function Settings() {
  const { signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (profile) setNotifications(profile.notifications_enabled);
  }, [profile]);

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotifications(enabled);
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'denied') {
        notify.info('Notifications are blocked in your browser settings.');
      }
    }
    const { error } = await updateProfile({ notifications_enabled: enabled });
    if (error) {
      notify.error(error);
      setNotifications(!enabled);
    }
  };

  const handleDeleteAccount = () => {
    // Account deletion requires a privileged server-side call (service role or
    // an Edge Function) since the anon client can't delete auth.users directly.
    // Wire this to a Supabase Edge Function in a future pass.
    notify.info("Account deletion isn't wired up yet — contact support for now.");
    setDeleteOpen(false);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Navbar title="Settings" showBack />
      <div className="app-page space-y-6 pt-0">
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <Moon className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Dark Mode</span>
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <Bell className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Notifications</span>
            <Toggle checked={notifications} onChange={handleToggleNotifications} />
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left"
          >
            <Bell className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Reminder settings</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left">
            <Globe className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Privacy Policy</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left">
            <DatabaseBackup className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Terms</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left">
            <Download className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">Contact us</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left text-danger"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">Delete account</span>
          </button>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="w-full rounded-button border border-gray-200 py-3.5 text-sm font-semibold text-text"
        >
          Logout
        </button>

        <p className="text-center text-xs text-text-muted">You can change these settings anytime.</p>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This will permanently delete your account and all logged data. This can't be undone."
        confirmLabel="Delete Account"
        tone="danger"
      />
    </div>
  );
}
