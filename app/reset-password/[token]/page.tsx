'use client';

import React, { useState, use } from 'react';
import { resetPassword } from '@/lib/api/auth';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ResetResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
  statusCode?: number;
}

const useForm = <T extends Record<string, any>>(
  initial: T,
  validate: (v: T) => Partial<Record<keyof T, string>>
) => {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  };
  const submit = (onValid: (vals: T) => void) => {
    const allTouched = Object.keys(values).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as any
    );
    setTouched(allTouched);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onValid(values);
  };
  return {
    values,
    errors,
    touched,
    onChange,
    onBlur,
    submit,
    setValues,
    setErrors,
  };
};

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'One number' },
  {
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    label: 'One special character',
  },
];

const ResetPasswordPage = ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const token = resolvedParams?.token || searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [completed, setCompleted] = useState(false);

  const form = useForm({ password: '', confirmPassword: '' }, (v) => {
    const errs: any = {};
    if (!v.password) errs.password = 'Password is required';
    else {
      const failing = passwordRules.filter((r) => !r.test(v.password));
      if (failing.length) errs.password = 'Password does not meet requirements';
    }
    if (!v.confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (v.confirmPassword !== v.password)
      errs.confirmPassword = 'Passwords do not match';
    return errs;
  });

  const handleSubmit = async () => {
    if (!token) {
      setResetError('Reset token missing or invalid.');
      return;
    }
    form.submit(async (vals) => {
      setIsLoading(true);
      setResetError('');
      setSuccessMessage('');
      try {
        const json = await resetPassword({
          token: token.trim(),
          newPassword: vals.password,
        });
        setSuccessMessage(
          json?.message || 'Password reset successful. You can now sign in.'
        );
        setCompleted(true);
      } catch (e: any) {
        setResetError(e.message || 'Reset failed');
      } finally {
        setIsLoading(false);
      }
    });
  };

  if (completed) {
    return (
      <div className='min-h-screen relative overflow-hidden bg-[#000000] lg:grid lg:grid-cols-2'>
        <div className="hidden lg:block relative overflow-hidden bg-[url('/images/auth-bg2.png')] bg-no-repeat bg-center bg-cover">
          <div className='flex flex-col justify-end h-full'>
            <img
              src='/images/bg1.png'
              alt='bg'
              className='absolute w-full bottom-0'
            />
            <div className='relative z-10 text-white p-8'>
              <h2 className='text-2xl xl:text-3xl font-semibold mb-2'>
                Password Reset
              </h2>
              <p className='text-[#D6D6D6] text-base xl:text-lg font-medium'>
                Your password has been updated.
              </p>
            </div>
          </div>
        </div>
        <div className='w-full bg-[#141414] lg:bg-none flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-20 min-h-screen lg:min-h-auto'>
          <div className='w-full max-w-md relative z-10'>
            <div className='mb-6 sm:mb-8'>
              <div className='flex items-center justify-center mb-4 sm:mb-6'>
                <img
                  src='/logos/logo.svg'
                  alt='Fyn Logo'
                  className='w-32 sm:w-36 h-auto'
                />
              </div>
              <h1 className='text-xl sm:text-2xl font-semibold text-white mb-2 text-center'>
                Password Reset Successful
              </h1>
              <p className='text-center text-[#B7B7B8] text-sm sm:text-base'>
                {successMessage}
              </p>
            </div>
            <div className='space-y-4 sm:space-y-6 w-full'>
              <Link
                href='/sign-in'
                className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors flex items-center justify-center gap-2'
              >
                <ArrowLeft className='w-4 h-4' /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen relative overflow-hidden bg-[#000000] lg:grid lg:grid-cols-2'>
      <div className="hidden lg:block relative overflow-hidden bg-[url('/images/auth-bg2.png')] bg-no-repeat bg-center bg-cover">
        <div className='flex flex-col justify-end h-full'>
          <img
            src='/images/bg1.png'
            alt='bg'
            className='absolute w-full bottom-0'
          />
          <div className='relative z-10 text-white p-8'>
            <h2 className='text-2xl xl:text-3xl font-bold mb-2'>
              Set a New Password
            </h2>
            <p className='text-[#D6D6D6] text-base xl:text-lg font-medium'>
              Create a strong password to secure your account.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full lg:bg-none flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-20 min-h-screen lg:min-h-auto'>
        <div className='lg:hidden absolute inset-0 opacity-10'>
          <div className='absolute top-10 right-10 w-32 h-32 bg-primary rounded-full blur-3xl'></div>
          <div className='absolute bottom-20 left-10 w-24 h-24 bg-primary/60 rounded-full blur-2xl'></div>
        </div>
        <div className='w-full max-w-md relative z-10 bg-[#141414] py-12 px-8 rounded-[22px]'>
          <div className='mb-6 sm:mb-8'>
            <div className='flex items-center justify-center mb-5 sm:mb-10'>
              <img
                src='/logos/logo.svg'
                alt='Fyn Logo'
                className='w-32 sm:w-36 h-auto'
              />
            </div>
            <h1 className='text-xl font-regular text-white mb-2 text-center sm:text-left'>
              Reset your password
            </h1>
            <p className='text-[#B7B7B8] text-sm text-center sm:text-left'>
              Enter and confirm your new password below.
            </p>
          </div>
          <div className='space-y-4 sm:space-y-6 w-full'>
            {resetError && (
              <div className='p-3 text-sm text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg'>
                {resetError}
              </div>
            )}
            {!token && (
              <div className='p-3 text-sm text-yellow-300 bg-yellow-900/40 border border-yellow-700 rounded-lg'>
                Missing token. Ensure you used the link from your email.
              </div>
            )}
            <div>
              <label
                htmlFor='password'
                className='block text-base font-medium text-white mb-2'
              >
                New Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={form.values.password}
                  onChange={form.onChange}
                  onBlur={form.onBlur}
                  disabled={isLoading}
                  className={`w-full px-3 sm:px-4 py-2.5 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                    form.touched.password && form.errors.password
                      ? 'border-red-500 bg-red-900 bg-opacity-20'
                      : ''
                  }`}
                  placeholder='Enter new password'
                  autoComplete='new-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((s) => !s)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white'
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              {form.touched.password && form.errors.password && (
                <p className='mt-1 text-sm text-red-400'>
                  {form.errors.password}
                </p>
              )}
              <ul className='mt-3 space-y-1 text-xs text-[#B7B7B8]'>
                {passwordRules.map((r) => (
                  <li
                    key={r.label}
                    className={
                      r.test(form.values.password)
                        ? 'text-green-400 flex items-center gap-1'
                        : 'flex items-center gap-1'
                    }
                  >
                    <span
                      className='w-2 h-2 rounded-full inline-block'
                      style={{
                        background: r.test(form.values.password)
                          ? '#16a34a'
                          : '#434343',
                      }}
                    ></span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-base font-medium text-white mb-2'
              >
                Confirm Password
              </label>
              <div className='relative'>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  value={form.values.confirmPassword}
                  onChange={form.onChange}
                  onBlur={form.onBlur}
                  disabled={isLoading}
                  className={`w-full px-3 sm:px-4 py-2.5 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                    form.touched.confirmPassword && form.errors.confirmPassword
                      ? 'border-red-500 bg-red-900 bg-opacity-20'
                      : ''
                  }`}
                  placeholder='Confirm new password'
                  autoComplete='new-password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirm((s) => !s)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white'
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              {form.touched.confirmPassword && form.errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-400'>
                  {form.errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isLoading || !token}
              aria-busy={isLoading}
              className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
            <div className='text-center'>
              <p className='text-sm text-[#B7B7B8]'>
                Remembered your password?{' '}
                <Link
                  href='/sign-in'
                  className='text-primary hover:underline font-medium'
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
