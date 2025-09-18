import React from 'react';

interface Vendor {
  id: number;
  name: string;
  service: string;
  status: 'Active' | 'In-active';
}

interface VendorsListProps {
  vendors: Vendor[];
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'In-active':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Active':
      return '/icons/dot-green.svg';
    case 'In-active':
      return '/icons/dot.svg';
    default:
      return '/icons/dot.svg';
  }
};

const VendorsList: React.FC<VendorsListProps> = ({ vendors }) => {
  return (
    <div className=' rounded-lg mt-8 overflow-hidden'>
      {/* Header */}
      <div className='mb-6 bg-[#FFFFFF0D] p-3'>
        <h2 className='text-white text-lg font-bold'>Vendors</h2>
      </div>

      {/* Vendors List */}
      <div className='space-y-4'>
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className='flex items-center justify-between py-3 border-b border-[#FFFFFF10] last:border-b-0 px-3'
          >
            <div className='flex-1'>
              <div className='text-white font-medium text-sm'>
                {vendor.name}
              </div>
              <div className='text-[#BDBDBE] text-xs font-medium'>
                Service: {vendor.service}
              </div>
            </div>
            <div className='flex-shrink-0'>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
                  vendor.status
                )}`}
              >
                <img
                  src={getStatusIcon(vendor.status)}
                  alt={vendor.status}
                  className='flex-shrink-0'
                />
                {vendor.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorsList;
