import { Calendar, Droplet, Activity, Smile, Zap, Moon, FileText } from 'lucide-react';

export const LOG_ACTIONS = [
  { label: 'Period', icon: Calendar, path: '/log/period' },
  { label: 'Flow', icon: Droplet, path: '/log/flow' },
  { label: 'Symptoms', icon: Activity, path: '/log/symptoms' },
  { label: 'Mood', icon: Smile, path: '/log/mood' },
  { label: 'Pain', icon: Zap, path: '/log/pain' },
  { label: 'Sleep', icon: Moon, path: '/log/sleep' },
  { label: 'Notes', icon: FileText, path: '/log/notes' },
];
