import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface OverviewCardProps {
  title: string;
  count: number;
  icon: string;
  iconAlt?: string;
  updatedTime: string;
  linkText: string;
  linkHref: string;
  bgColor?: string;
  iconBgColor?: string;
  textColor?: string;
  linkColor?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  count,
  icon,
  iconAlt = 'Icon',
  updatedTime,
  linkText,
  linkHref,
  bgColor = 'bg-white',
  iconBgColor = 'bg-orange-500',
  textColor = 'text-gray-900',
  linkColor = 'text-orange-500',
}) => {
  return (
    <div
      className={`rounded-lg shadow-sm p-3 transition-shadow hover:shadow-md bg-[#FFFFFF0D] text-[#FFFFFF] font-semibold flex flex-col justify-between`}
    >
      {/* Header with icon and title */}
      <div className='flex items-center gap-3 mb-4'>
        <div className={`rounded-lg`}>
          <img src={icon} alt={iconAlt} className='object-contain' />
        </div>
        <div className=''>
          <h3 className={`text-[#BDBDBE] font-semibold text-sm`}>{title}</h3>
          <p className={`text-white text-2xl font-semibold font-figtree`}>
            {count.toLocaleString()}
          </p>
        </div>
      </div>
      {/* Footer with update time and link */}
      <div className='flex items-center justify-between'>
        {/* <p className='text-[#BDBDBE] text-xs'>Updated {updatedTime}</p> */}
        <Link
          href={linkHref}
          className={`text-primary text-xs font-semibold flex items-center gap-1 transition-colors hover:bg-primary hover:text-white p-1.5 rounded`}
        >
          {linkText}
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5l7 7-7 7'
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default OverviewCard;
