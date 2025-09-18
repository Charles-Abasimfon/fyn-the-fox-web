'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const TopBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: '/overview',
      isActive: pathname === '/overview',
    },
    { label: 'Vendors', href: '/vendors', isActive: pathname === '/vendors' },
    {
      label: 'Work Orders',
      href: '/work-orders',
      isActive: pathname === '/work-orders',
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className='backdrop-blur-md text-white border border-white/20 rounded-[22px]'>
      <div className='flex items-center justify-between px-6 py-3'>
        {/* Logo */}
        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-2'>
            <Image
              src='/logos/logo.svg'
              alt='Fyn Logo'
              width={80}
              height={80}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className='flex items-center bg-[#FFFFFF0D] rounded-sm overflow-hidden border border-white/20'>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className={`px-6 py-2 text-lg font-medium transition-colors hover:bg-gray-600 ${
                item.isActive
                  ? 'bg-[#141414] text-white hover:bg-gray-600'
                  : 'text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User Profile Dropdown */}
        <div className='flex items-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#FAFAFA14] border border-[#FFFFFF05] hover:bg-gray-800'>
                <div className='flex items-center space-x-2'>
                  <div className='w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center'>
                    <span className='text-sm font-medium'>JD</span>
                  </div>
                  <div className='text-left'>
                    <div className='text-base font-semibold'>John Doe</div>
                    <div className='text-[10px] text-[#F9FAFB] font-medium'>
                      nelson@example.com
                    </div>
                  </div>
                  <div className='flex items-center justify-center bg-[#F9FAFB0A] border border-[#F2F4F705] rounded-[6px] p-1 ml-6'>
                    <ChevronRightIcon className='w-4 h-4 text-[#A0A6B1]' />
                  </div>
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
              <DropdownMenuItem>
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
