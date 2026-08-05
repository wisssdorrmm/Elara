import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await resetPassword(values.email);
    if (error) {
      notify.error(error);
      return;
    }
    setSent(true);
    notify.success('Reset link sent!');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showBack />
      <div className="flex flex-1 items-center justify-center px-5">
        <div className="w-full">
          <h1 className="mb-1 text-2xl font-bold text-text">Reset your password</h1>
          <p className="mb-8 text-text-muted">
            {sent ? "Check your inbox for a link to reset your password." : "Enter your email and we'll send you a reset link."}
          </p>

          {!sent && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" loading={isSubmitting}>
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
