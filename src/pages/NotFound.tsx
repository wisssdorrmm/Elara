import { useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Moon className="h-8 w-8 text-primary" />
      </span>
      <h1 className="text-2xl font-bold text-text">Page not found</h1>
      <p className="text-text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Button fullWidth={false} className="px-8" onClick={() => navigate('/')}>
        Back to Home
      </Button>
    </div>
  );
}
