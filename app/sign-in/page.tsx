'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

// Formik-like validation hook (keeping your existing implementation)
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

const SignInPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
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

      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      return errors;
    },
    onSubmit: async (values: any) => {
      setIsLoading(true);
      setLoginError('');

      try {
        // Simulate form submission
        console.log('Form submitted with values:', values);

        // You can add your authentication logic here
        // For now, just simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Example success handling
        console.log('Login successful');

        // Redirect logic can be added here
        // router.push('/dashboard');
      } catch (error) {
        console.error('Login error:', error);
        setLoginError('An error occurred during login');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className='min-h-screen relative overflow-hidden bg-gray-900 lg:grid lg:grid-cols-2'>
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
            <h1 className='text-xl sm:text-2xl font-semibold text-white mb-2 text-center sm:text-left'>
              Welcome back, Sign-In to continue
            </h1>
          </div>

          <div className='space-y-4 sm:space-y-6 w-full'>
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
                className='block text-base font-medium text-white mb-2'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500 bg-red-900 bg-opacity-20'
                    : ''
                }`}
                placeholder='Email here'
              />
              {formik.touched.email && formik.errors.email && (
                <p className='mt-1 text-sm text-red-400'>
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-base font-medium text-white mb-2'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-base rounded-lg bg-[#141414] text-white border border-[#434343] focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 ${
                    formik.touched.password && formik.errors.password
                      ? 'border-red-500 bg-red-900 bg-opacity-20'
                      : ''
                  }`}
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 disabled:opacity-50'
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4 sm:w-5 sm:h-5' />
                  ) : (
                    <Eye className='w-4 h-4 sm:w-5 sm:h-5' />
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className='mt-1 text-sm text-red-400'>
                  {formik.errors.password}
                </p>
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
              onClick={formik.handleSubmit}
              disabled={isLoading}
              className='w-full bg-primary text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg font-medium hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Signing in...' : 'Sign-In'}
            </button>

            {/* Terms and Privacy */}
            <div className='text-center text-sm sm:text-base font-medium text-[#B7B7B8] mt-4 sm:mt-6'>
              <p className='leading-relaxed'>
                By signing in or creating account, you agree with our{' '}
                <Link href='/terms' className='text-primary hover:underline'>
                  Terms & conditions
                </Link>{' '}
                &{' '}
                <Link href='/privacy' className='text-primary hover:underline'>
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
