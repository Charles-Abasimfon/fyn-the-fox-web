'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

function SignInInner() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // Redirect if authenticated (avoid loop during loading or token error states)
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/overview');
    }
  }, [status, router]);

  // Handle next-auth error messages via query param
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const map: Record<string, string> = {
        CredentialsSignin: 'Invalid email or password',
        AccessDenied: 'Access denied',
        SessionRequired: 'Please sign in to continue',
        default: 'Authentication failed',
      };
      setLoginError(map[error] || map.default);
    }
  }, [searchParams]);

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({
    email: '',
    password: '',
  });

  const validate = (vals: typeof values) => {
    const errs: typeof errors = {};
    if (!vals.email) errs.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(vals.email))
      errs.email = 'Invalid email address';
    if (!vals.password) errs.password = 'Password is required';
    else if (vals.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (touched[name as keyof typeof touched]) {
      setErrors(validate({ ...values, [name]: value }));
    }
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async () => {
    const newTouched = { email: true, password: true };
    setTouched(newTouched);
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    setLoginError('');
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: '/overview',
      });
      if (!res) {
        setLoginError('No response from server');
      } else if (res.error) {
        setLoginError(
          res.error === 'CredentialsSignin'
            ? 'Invalid email or password'
            : res.error
        );
      } else if (res.ok) {
        router.push(res.url || '/overview');
      }
    } catch (e: any) {
      setLoginError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative overflow-hidden bg-[#101014] lg:grid lg:grid-cols-2'>
      {/* Left side with fox character - hidden on mobile, shown on lg+ */}
      <div className='hidden lg:block relative overflow-hidden bg-[url("/images/auth-bg2.png")] bg-no-repeat bg-center bg-cover'>
        <div className='flex flex-col justify-end h-full'>
          <img
            src='/images/bg1.png'
            alt='bg'
            className='absolute w-full bottom-0'
          />
          <div className='relative z-10 text-white p-8'>
            <h2 className='text-2xl xl:text-3xl font-bold mb-2'>
              Say Goodbye to Maintenance Stress
            </h2>
            <p className='text-[#D6D6D6] text-base xl:text-lg font-medium'>
              Let AI handle the stressful part while you use your time for other
              things.
            </p>
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className='w-full lg:bg-none flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-20 min-h-screen lg:min-h-auto'>
        <div className='w-full max-w-md relative z-10 bg-[#141414] py-12 px-8 rounded-[22px]'>
          {/* Logo and Title */}
          <div className='mb-4'>
            <div className='flex items-center justify-center mb-4 sm:mb-6'>
              <img
                src='/logos/logo.svg'
                alt='Fyn Logo'
                className='w-32 sm:w-36 h-auto'
              />
            </div>
            <h1 className='text-xl font-regular text-white mb-2 text-center sm:text-left'>
              Welcome back, Sign-In to continue
            </h1>
          </div>

          <div className='space-y-4 w-full'>
            {/* Login Error Message */}
            {loginError && (
              <div className='p-3 text-sm text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg'>
                {loginError}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-regular text-white mb-2'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`w-full px-3 sm:px-4 py-2.5 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                  touched.email && errors.email
                    ? 'border-red-500 bg-red-900 bg-opacity-20'
                    : ''
                }`}
                placeholder='Email here'
              />
              {touched.email && errors.email && (
                <p className='mt-1 text-sm text-red-400'>{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-regular text-white mb-2'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={`w-full px-3 sm:px-4 py-2.5 pr-10 sm:pr-12 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                    touched.password && errors.password
                      ? 'border-red-500 bg-red-900 bg-opacity-20'
                      : ''
                  }`}
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 disabled:opacity-50 cursor-pointer'
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4 sm:w-5 sm:h-5' />
                  ) : (
                    <Eye className='w-4 h-4 sm:w-5 sm:h-5' />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className='mt-1 text-sm text-red-400'>{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className='text-left'>
              <Link
                href='/forgot-password'
                className='text-sm text-primary hover:underline font-medium'
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isLoading || status === 'authenticated'}
              className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Signing in...' : 'Sign-In'}
            </button>

            {/* Terms and Privacy */}
            <div className='text-center text-sm font-medium text-[#B7B7B8] mt-2'>
              <p className='leading-relaxed'>
                By signing in or creating account, you agree with our{' '}
                <Link
                  href='https://www.fynthefox.ai/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  Terms & conditions
                </Link>{' '}
                &{' '}
                <Link
                  href='https://www.fynthefox.ai/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reconstruct full component with suspense boundary preserving prior JSX
const SignInPage: React.FC = () => {
  return (
    <Suspense fallback={<div className='text-white p-8'>Loading...</div>}>
      <SignInInner />
    </Suspense>
  );
};

export default SignInPage;
