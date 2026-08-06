import { useNavigate } from 'react-router-dom';
import { Calendar, Droplet, Activity, Smile, Zap, Moon, FileText } from 'lucide-react';

const options = [
  { label: 'Period', icon: Calendar, path: '/log/period' },
  { label: 'Flow', icon: Droplet, path: '/log/flow' },
  { label: 'Symptoms', icon: Activity, path: '/log/symptoms' },
  { label: 'Mood', icon: Smile, path: '/log/mood' },
  { label: 'Pain', icon: Zap, path: '/log/pain' },
  { label: 'Sleep', icon: Moon, path: '/log/sleep' },
  { label: 'Notes', icon: FileText, path: '/log/notes' },
];

export default function LogHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">What would you like to log?</h1>
      <div className="space-y-2.5">
        {options.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex w-full items-center gap-3 rounded-card bg-white px-4 py-4 text-left shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <span className="font-medium text-text">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
