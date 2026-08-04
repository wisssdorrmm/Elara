import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const baseStyle = {
  borderRadius: '16px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 500,
  boxShadow: '0 8px 30px -6px rgba(124, 58, 237, 0.18)',
};

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
      style: { ...baseStyle, background: '#F0FDF4', color: '#166534' },
    }),
  error: (message: string) =>
    toast.error(message, {
      icon: <XCircle className="h-5 w-5 text-danger" />,
      style: { ...baseStyle, background: '#FEF2F2', color: '#991B1B' },
    }),
  info: (message: string) =>
    toast(message, {
      icon: <Info className="h-5 w-5 text-primary" />,
      style: { ...baseStyle, background: '#F5F3FF', color: '#5B21B6' },
    }),
};
