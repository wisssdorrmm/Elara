import { useNavigate } from 'react-router-dom';
import { LOG_ACTIONS } from '@/constants/logActions';

export default function LogHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">What would you like to log?</h1>
      <div className="space-y-2.5">
        {LOG_ACTIONS.map(({ label, icon: Icon, path }) => (
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
