import { Bell } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { EmptyState } from '@/components/ui/EmptyState';

// TODO (Part 7, after SQL confirmed): replace this static empty state with
// real data via a notificationService + useNotifications hook reading from
// the `notifications` table, with mark-as-read / mark-all-as-read actions.
export default function Notifications() {
  return (
    <div>
      <Navbar title="Notifications" showBack />
      <div className="app-page pt-0">
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see updates here — partner activity, streak milestones, and reminders — once they happen."
        />
      </div>
    </div>
  );
}
