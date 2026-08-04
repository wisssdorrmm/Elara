import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreed: z.boolean().refine((v) => v === true, { message: 'You must agree to continue' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { agreed: false } });

  const agreed = watch('agreed');

  const onSubmit = async (values: FormValues) => {
    const { error } = await signUp(values.email, values.password);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Account created!');
    navigate('/onboarding');
  };

  return (
    <div className="app-page">
      <h1 className="mb-1 text-2xl font-bold text-text">Create Account</h1>
      <p className="mb-8 text-text-muted">Sign up to get started</p>

      <div className="mb-4 space-y-3">
        <Button variant="outline" icon={<span className="font-bold text-[#4285F4]">G</span>}>
          Continue with Google
        </Button>
        <Button variant="outline" icon={<span></span>}>
          Continue with Apple
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="Enter your name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
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
          label="Confirm password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="••••••••••"
          error={errors.confirmPassword?.message}
          trailing={
            <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle confirm password visibility">
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <label className="flex cursor-pointer items-start gap-2.5">
          <button
            type="button"
            onClick={() => setValue('agreed', !agreed, { shouldValidate: true })}
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
              agreed ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
            )}
          >
            {agreed && <Check className="h-3.5 w-3.5 text-white" />}
          </button>
          <span className="text-sm text-text-muted">
            I agree to the <span className="font-medium text-primary">Privacy Policy</span> and{' '}
            <span className="font-medium text-primary">Terms</span>
          </span>
        </label>
        {errors.agreed && <p className="text-sm text-danger">{errors.agreed.message}</p>}

        <Button type="submit" loading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
