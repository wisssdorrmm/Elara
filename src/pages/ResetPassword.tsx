import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { notify } from '@/utils/toast';

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await authService.updatePassword(values.password);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Password updated! Please log in.');
    navigate('/login');
  };

  return (
    <div>
      <Navbar showBack />
      <div className="app-page pt-0">
        <h1 className="mb-1 text-2xl font-bold text-text">Set a new password</h1>
        <p className="mb-8 text-text-muted">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••"
            error={errors.password?.message}
            trailing={
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            {...register('password')}
          />
          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isSubmitting}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
