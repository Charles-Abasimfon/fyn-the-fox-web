'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDownIcon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  ChevronRightIcon,
  MenuIcon,
} from 'lucide-react';
import { useMode } from '@/components/auth/ModeProvider';

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const TopBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { mode, setMode } = useMode();

  const isHosp = pathname.startsWith('/hospitality');
  const navItems: NavItem[] = isHosp
    ? [
        {
          label: 'Overview',
          href: '/hospitality/overview',
          isActive: pathname === '/hospitality/overview',
        },
        {
          label: 'Reservations',
          href: '/hospitality/reservations',
          isActive: pathname === '/hospitality/reservations',
        },
        {
          label: 'Events',
          href: '/hospitality/events',
          isActive: pathname === '/hospitality/events',
        },
        {
          label: 'Upsells',
          href: '/hospitality/upsells',
          isActive: pathname === '/hospitality/upsells',
        },
      ]
    : [
        {
          label: 'Overview',
          href: '/property-owner/overview',
          isActive: pathname === '/property-owner/overview',
        },
        {
          label: 'Tenants',
          href: '/property-owner/tenants',
          isActive: pathname === '/property-owner/tenants',
        },
        {
          label: 'Vendors',
          href: '/property-owner/vendors',
          isActive: pathname === '/property-owner/vendors',
        },
        {
          label: 'Work Orders',
          href: '/property-owner/work-orders',
          isActive: pathname === '/property-owner/work-orders',
        },
      ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const userInitials = React.useMemo(() => {
    const name = session?.user?.name || '';
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('') || 'UU'
    );
  }, [session?.user?.name]);

  return (
    <div className='backdrop-blur-md text-white border border-white/20 rounded-[22px]'>
      <div className='flex items-center justify-between px-3 py-2 md:px-6'>
        {/* Logo */}
        <div className='flex items-center gap-3'>
          <Image src='/logos/logo.svg' alt='Fyn Logo' width={64} height={64} />
        </div>

        {/* Navigation */}
        <div className='hidden md:flex items-center bg-[#FFFFFF0D] rounded-sm overflow-hidden border border-white/20'>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className={`px-6 py-2 text-base font-medium transition-colors hover:bg-gray-600 ${
                item.isActive
                  ? 'bg-[#141414] text-white hover:bg-gray-600'
                  : 'text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        {/* <div className='hidden md:flex items-center gap-2 mr-2'>
          <div className='flex rounded-md border border-white/20 overflow-hidden'>
            <button
              type='button'
              onClick={() => {
                setMode('property');
                router.push('/property-owner/overview?view=property');
              }}
              className={`px-3 py-1 text-sm ${
                mode === 'property' ? 'bg-primary text-white' : 'text-white/80'
              }`}
            >
              Property
            </button>
            <button
              type='button'
              onClick={() => {
                setMode('hospitality');
                router.push('/hospitality/overview?view=hospitality');
              }}
              className={`px-3 py-1 text-sm ${
                mode === 'hospitality'
                  ? 'bg-primary text-white'
                  : 'text-white/80'
              }`}
            >
              Hospitality
            </button>
          </div>
        </div> */}

        {/* User Profile Dropdown */}
        <div className='flex items-center gap-2'>
          {/* Mobile nav (hamburger) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='md:hidden inline-flex items-center justify-center size-9 p-0 rounded-lg bg-[#FAFAFA14] border border-[#FFFFFF05] hover:bg-gray-800'
                aria-label='Open navigation menu'
              >
                <MenuIcon className='w-5 h-5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-56 bg-[#27272B] text-[#FFFFFF] font-semibold border border-[#434343]'
            >
              {/* <DropdownMenuLabel>Navigate</DropdownMenuLabel>
              <DropdownMenuSeparator className='bg-[#434343]' /> */}
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  className={item.isActive ? 'bg-[#141414]' : ''}
                  onSelect={() => handleNavigation(item.href)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='inline-flex items-center justify-center size-9 p-0 md:h-auto md:w-auto md:px-3 md:py-2 md:gap-2 rounded-lg bg-[#FAFAFA14] border border-[#FFFFFF05] hover:bg-gray-800'
                aria-label='Open user menu'
              >
                <div className='size-5 md:size-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0'>
                  <span className='text-[10px] md:text-sm font-medium'>
                    {userInitials}
                  </span>
                </div>
                {/* Details hidden on mobile, shown on md+ */}
                <div className='hidden md:block text-left'>
                  <div className='text-base font-semibold leading-none'>
                    {session?.user?.name || 'User'}
                  </div>
                  <div className='text-[10px] text-[#F9FAFB] font-medium'>
                    {session?.user?.email || 'Email'}
                  </div>
                </div>
                <div className='hidden md:flex items-center justify-center bg-[#F9FAFB0A] border border-[#F2F4F705] rounded-[6px] p-1 ml-1 md:ml-3'>
                  <ChevronRightIcon className='w-4 h-4 text-[#A0A6B1]' />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-56 bg-[#27272B] text-[#FFFFFF] font-semibold border border-[#434343]'
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className='bg-[#434343]' />
              <DropdownMenuItem>
                <UserIcon className='w-4 h-4 mr-2' />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className='w-4 h-4 mr-2' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className='bg-[#434343]' />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
              >
                <LogOutIcon className='w-4 h-4 mr-2' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
