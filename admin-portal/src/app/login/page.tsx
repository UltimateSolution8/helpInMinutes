'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { login, clearError } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, error } = useAppSelector((state: RootState) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const redirect = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@helpinminutes.com',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    
    try {
      const result = await dispatch(login(data));
      
      if (login.fulfilled.match(result)) {
        // Store tokens in localStorage
        const payload = result.payload as { user: unknown; accessToken: string; refreshToken: string; expiresIn: number };
        localStorage.setItem('accessToken', payload.accessToken);
        localStorage.setItem('refreshToken', payload.refreshToken);
        localStorage.setItem('tokenExpiry', String(Date.now() + payload.expiresIn * 1000));
        localStorage.setItem('userRole', (payload.user as { role: string }).role);
        
        router.push(redirect);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">
            H
          </div>
          <h1 className="text-2xl font-bold">HelpInMinutes</h1>
          <p className="text-muted-foreground mt-1">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-xl border shadow-lg p-8">
          <h2 className="text-xl font-semibold text-center mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@helpinminutes.com"
                className={cn(
                  'form-input',
                  errors.email && 'border-destructive focus-visible:ring-destructive'
                )}
                defaultValue="admin@helpinminutes.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn(
                    'form-input pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-input" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p className="text-muted-foreground">
              Email: admin@helpinminutes.com<br />
              Password: admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">
            H
          </div>
          <h1 className="text-2xl font-bold">HelpInMinutes</h1>
          <p className="text-muted-foreground mt-1">Admin Portal</p>
        </div>
        <div className="bg-card rounded-xl border shadow-lg p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}
