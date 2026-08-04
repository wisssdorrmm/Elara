import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorScreenProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorScreen({
  title = 'Something went wrong',
  description = "We couldn't load this right now. Please try again.",
  onRetry,
}: ErrorScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle className="h-8 w-8 text-danger" />
      </span>
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      <p className="text-text-muted">{description}</p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={() => (onRetry ? onRetry() : window.location.reload())}>Try Again</Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
