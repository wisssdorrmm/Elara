import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-gray-100 text-text-muted',
};

export function Badge({ children, tone = 'primary', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
