/**
 * Browser notification scaffolding for period reminders.
 *
 * What's implemented now: permission request/check, and a helper to fire an
 * immediate local notification (useful for testing "on the day" reminders
 * while the app is open).
 *
 * What's NOT implemented yet (needs a server-side piece):
 * Reminders "N days before" a predicted period need to fire even when the
 * app is closed. That requires either:
 *   1. A Supabase Edge Function on a cron schedule that checks each user's
 *      reminder_days_before/reminder_time against their predicted next
 *      period and sends a push via the Web Push protocol, or
 *   2. A service worker + Push API subscription stored per-user.
 * Both need a subscription endpoint + VAPID keys, which is a follow-up task.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

export function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.svg' });
}
