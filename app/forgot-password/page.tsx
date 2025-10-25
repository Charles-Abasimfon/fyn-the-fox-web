'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { forgotPassword } from '@/lib/api/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Formik-like validation hook
const useFormik = (config: any) => {
  const [values, setValues] = useState(config.initialValues);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: any) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev: any) => ({ ...prev, [name]: true }));

    if (config.validate) {
      const validationErrors = config.validate(values);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = () => {
    const touchedFields = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as any);
    setTouched(touchedFields);

    const validationErrors = config.validate ? config.validate(values) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      config.onSubmit(values);
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  };
};

// Inner component that uses navigation hooks; must be wrapped in <Suspense>
const ForgotPasswordContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  type ViewMode = 'property' | 'hospitality';
  const [view, setView] = useState<ViewMode>('property');

  // Initialize view from URL or localStorage, and ensure URL contains it
  useEffect(() => {
    try {
      const qp = (searchParams.get('view') || '').toLowerCase();
      const stored =
        typeof window !== 'undefined'
          ? (localStorage.getItem('fyn_view') || '').toLowerCase()
          : '';
      let initial: ViewMode = 'property';
      if (qp === 'hospitality' || qp === 'property') initial = qp as ViewMode;
      else if (stored === 'hospitality' || stored === 'property')
        initial = stored as ViewMode;
      setView(initial);

      // If URL missing, sync it silently
      if (!qp) {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('view', initial);
        router.replace(`${pathname}?${sp.toString()}`);
      }
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateView = (next: ViewMode) => {
    setView(next);
    try {
      if (typeof window !== 'undefined') localStorage.setItem('fyn_view', next);
    } catch {
      // ignore storage errors
    }
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('view', next);
    router.replace(`${pathname}?${sp.toString()}`);
  };

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validate: (values: any) => {
      const errors: any = {};

      if (!values.email) {
        errors.email = 'Email is required';
      } else if (
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
      ) {
        errors.email = 'Invalid email address';
      }

      return errors;
    },
    onSubmit: async (values: any) => {
      setIsLoading(true);
      setResetError('');
      setSuccessMessage('');
      try {
        const res = await forgotPassword({ email: values.email });
        setSuccessMessage(
          res.message || 'If an account exists, a reset link has been sent.'
        );
        setIsEmailSent(true);
      } catch (error: any) {
        console.error('Password reset error:', error);
        setResetError(
          error?.message || 'An error occurred while sending the reset email'
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isEmailSent) {
    return (
      <div className='min-h-screen relative overflow-hidden bg-[#000000] lg:grid lg:grid-cols-2'>
        {/* Left side with fox character - hidden on mobile, shown on lg+ */}
        <div className="hidden lg:block relative overflow-hidden bg-[url('/images/auth-bg2.png')] bg-no-repeat bg-center bg-cover">
          <div className='flex flex-col justify-end h-full'>
            <img
              src='/images/bg1.png'
              alt='bg'
              className='absolute w-full bottom-0'
            />
            <div className='relative z-10 text-white p-8'>
              <h2 className='text-2xl xl:text-3xl font-semibold mb-2'>
                Check Your Email
              </h2>
              <p className='text-[#D6D6D6] text-base xl:text-lg font-medium'>
                {successMessage ||
                  "We've sent you instructions to reset your password."}
              </p>
            </div>
          </div>
        </div>

        {/* Right side with success message */}
        <div className='w-full bg-[#141414] lg:bg-none flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-20 min-h-screen lg:min-h-auto'>
          {/* Mobile background decoration */}
          <div className='lg:hidden absolute inset-0 opacity-10'>
            <div className='absolute top-10 right-10 w-32 h-32 bg-primary rounded-full blur-3xl'></div>
            <div className='absolute bottom-20 left-10 w-24 h-24 bg-primary/60 rounded-full blur-2xl'></div>
          </div>

          <div className='w-full max-w-md relative z-10'>
            {/* Logo and Title */}
            <div className='mb-6 sm:mb-8'>
              <div className='flex items-center justify-center mb-4 sm:mb-6'>
                <img
                  src='/logos/logo.svg'
                  alt='Fyn Logo'
                  className='w-32 sm:w-36 h-auto'
                />
              </div>
              <h1 className='text-xl sm:text-2xl font-semibold text-white mb-2 text-center'>
                Check Your Email
              </h1>
              <p className='text-center text-[#B7B7B8] text-sm sm:text-base'>
                {successMessage || "We've sent password reset instructions"} to{' '}
                <span className='text-primary font-medium'>
                  {formik.values.email}
                </span>
              </p>
            </div>

            <div className='space-y-4 sm:space-y-6 w-full'>
              {/* Success Message */}
              <div className='p-4 text-center bg-green-900 bg-opacity-20 border border-green-700 rounded-lg'>
                <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <svg
                    className='w-8 h-8 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-white mb-2'>
                  Email Sent Successfully!
                </h3>
                <p className='text-sm text-green-200'>
                  {successMessage ||
                    'Please check your inbox and follow the instructions to reset your password.'}
                </p>
              </div>

              {/* Back to Sign In */}
              <Link
                href='/sign-in'
                className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors flex items-center justify-center gap-2'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to Sign In
              </Link>

              {/* Resend Email */}
              <div className='text-center'>
                <p className='text-sm text-[#B7B7B8] mb-2'>
                  Didn't receive the email?
                </p>
                <button
                  onClick={() => {
                    setIsEmailSent(false);
                    setSuccessMessage('');
                    setResetError('');
                  }}
                  className='text-sm text-primary hover:underline font-medium cursor-pointer'
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen relative overflow-hidden bg-[#000000] lg:grid lg:grid-cols-2'>
      {/* Left side with fox character - hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block relative overflow-hidden bg-[url('/images/auth-bg2.png')] bg-no-repeat bg-center bg-cover">
        <div className='flex flex-col justify-end h-full'>
          <img
            src='/images/bg1.png'
            alt='bg'
            className='absolute w-full bottom-0'
          />
          <div className='relative z-10 text-white p-8'>
            <h2 className='text-2xl xl:text-3xl font-bold mb-2'>
              Reset Your Password
            </h2>
            <p className='text-[#D6D6D6] text-base xl:text-lg font-medium'>
              Enter your email and we'll send you instructions to reset your
              password.
            </p>
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className='w-full lg:bg-none flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-20 min-h-screen lg:min-h-auto'>
        {/* Mobile background decoration */}
        <div className='lg:hidden absolute inset-0 opacity-10'>
          <div className='absolute top-10 right-10 w-32 h-32 bg-primary rounded-full blur-3xl'></div>
          <div className='absolute bottom-20 left-10 w-24 h-24 bg-primary/60 rounded-full blur-2xl'></div>
        </div>

        <div className='w-full max-w-md relative z-10 bg-[#141414]  py-12 px-8 rounded-[22px]'>
          {/* Logo and Title */}
          <div className='mb-6 sm:mb-8'>
            <div className='flex items-center justify-center mb-5 sm:mb-10'>
              <img
                src='/logos/logo.svg'
                alt='Fyn Logo'
                className='w-32 sm:w-36 h-auto'
              />
            </div>
            <h1 className='text-xl font-regular text-white mb-2 text-center sm:text-left'>
              Forgot your password?
            </h1>
            <p className='text-[#B7B7B8] text-sm text-center sm:text-left'>
              No worries! Enter your email address and we'll send you
              instructions to reset your password.
            </p>
          </div>

          <div className='space-y-4 sm:space-y-6 w-full'>
            {/* View Toggle */}
            <div className='flex w-full items-center justify-center sm:justify-start'>
              <div
                className='w-full grid grid-cols-2 gap-1 rounded-lg border border-[#434343] bg-[#0f0f10] p-1'
                role='tablist'
                aria-label='Select vertical'
              >
                <button
                  type='button'
                  role='tab'
                  aria-selected={view === 'property'}
                  onClick={() => updateView('property')}
                  className={`w-full px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium text-center transition-colors ${
                    view === 'property'
                      ? 'bg-primary text-white shadow'
                      : 'text-[#B7B7B8] hover:text-white'
                  }`}
                >
                  Property
                </button>
                <button
                  type='button'
                  role='tab'
                  aria-selected={view === 'hospitality'}
                  onClick={() => updateView('hospitality')}
                  className={`w-full px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium text-center transition-colors ${
                    view === 'hospitality'
                      ? 'bg-primary text-white shadow'
                      : 'text-[#B7B7B8] hover:text-white'
                  }`}
                >
                  Hospitality
                </button>
              </div>
            </div>
            {/* Reset Error Message */}
            {resetError && (
              <div className='p-3 text-sm text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg'>
                {resetError}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-base font-medium text-white mb-2'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
                className={`w-full px-3 sm:px-4 py-2.5 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500 bg-red-900 bg-opacity-20'
                    : ''
                }`}
                placeholder='Enter your email address'
              />
              {formik.touched.email && formik.errors.email && (
                <p className='mt-1 text-sm text-red-400'>
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Send Reset Instructions Button */}
            <button
              type='button'
              onClick={formik.handleSubmit}
              disabled={
                isLoading ||
                !formik.values.email ||
                !!(formik.touched.email && formik.errors.email)
              }
              className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              aria-busy={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send reset instructions'}
            </button>

            {/* Remember Password? */}
            <div className='text-center'>
              <p className='text-sm text-[#B7B7B8]'>
                Remember your password?{' '}
                <Link
                  href='/sign-in'
                  className='text-primary hover:underline font-medium'
                >
                  Sign in instead
                </Link>
              </p>
            </div>

            {/* Terms and Privacy */}
            {/* <div className='text-center text-sm sm:text-base font-medium text-[#B7B7B8] mt-4 sm:mt-6'>
              <p className='leading-relaxed'>
                By continuing, you agree with our{' '}
                <Link href='/terms' className='text-primary hover:underline'>
                  Terms & conditions
                </Link>{' '}
                &{' '}
                <Link href='/privacy' className='text-primary hover:underline'>
                  Privacy policy
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Page component provides the required Suspense boundary for useSearchParams
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
