import React from 'react';
import OverviewCard from '@/components/dashboard/OverviewCard';
import ComplaintsTable from '@/components/dashboard/ComplaintsTable';
import VendorsList from '@/components/dashboard/VendorsList';

// Local interfaces mirroring the expected props of the imported components
interface Complaint {
  id: number;
  name: string;
  complaint: string;
  propertyAddress: string;
  units: string;
  assignedTo: string;
  assignedRole: string;
  scheduledDate: string;
  scheduledTime: string;
  status:
    | 'Assigned'
    | 'Completed'
    | 'Pending'
    | 'Scheduled'
    | 'In Progress'
    | 'Estimate needed'
    | 'Resident confirmation'
    | 'Pending vendors acceptance';
}

interface Vendor {
  id: number;
  name: string;
  service: string;
  status: 'Active' | 'In-active';
}

const OverviewPage = () => {
  // Sample data for complaints table
  const complaintsData: Complaint[] = [
    {
      id: 1,
      name: 'John William',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '1234 Elm St.',
      units: '03',
      assignedTo: 'John William',
      assignedRole: 'Plumber',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Assigned',
    },
    {
      id: 2,
      name: 'Emilia Sexton',
      complaint: 'I do not have hot water running',
      propertyAddress: '5678 Oak Ave.',
      units: '03',
      assignedTo: 'Emilia Sexton',
      assignedRole: 'Electrician',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Completed',
    },
    {
      id: 3,
      name: 'Dave Bundeux',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '9101 Maple Dr.',
      units: '03',
      assignedTo: 'John William',
      assignedRole: 'Plumber',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Pending',
    },
    {
      id: 4,
      name: 'Johnathan Adams',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '2345 Pine Lane',
      units: '03',
      assignedTo: 'Emilia Sexton',
      assignedRole: 'Electrician',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Scheduled',
    },
    {
      id: 5,
      name: 'Emilie Theo',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '6789 Cedar Blvd.',
      units: '03',
      assignedTo: 'John William',
      assignedRole: 'Plumber',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'In Progress',
    },
    {
      id: 6,
      name: 'Sylvie Carpenter',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '3456 Birch St.',
      units: '03',
      assignedTo: 'Emilia Sexton',
      assignedRole: 'Electrician',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Estimate needed',
    },
    {
      id: 7,
      name: 'Anthony Dexter',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '7890 Spruce Ave.',
      units: '03',
      assignedTo: 'John William',
      assignedRole: 'Plumber',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Resident confirmation',
    },
    {
      id: 8,
      name: 'Natalie Ruud',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '4567 Willow Rd.',
      units: '03',
      assignedTo: 'Emilia Sexton',
      assignedRole: 'Electrician',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Pending vendors acceptance',
    },
  ];

  // Sample data for vendors list
  const vendorsData: Vendor[] = [
    { id: 1, name: 'John William', service: 'Plumbing', status: 'Active' },
    {
      id: 2,
      name: 'Emilia Sexton',
      service: 'Electrical',
      status: 'In-active',
    },
    { id: 3, name: 'John William', service: 'Plumbing', status: 'Active' },
    {
      id: 4,
      name: 'Emilia Sexton',
      service: 'Electrical',
      status: 'In-active',
    },
    { id: 5, name: 'John William', service: 'Plumbing', status: 'Active' },
    {
      id: 6,
      name: 'Emilia Sexton',
      service: 'Electrical',
      status: 'In-active',
    },
    { id: 7, name: 'John William', service: 'Plumbing', status: 'Active' },
    {
      id: 8,
      name: 'Emilia Sexton',
      service: 'Electrical',
      status: 'In-active',
    },
    { id: 9, name: 'John William', service: 'Plumbing', status: 'Active' },
    {
      id: 10,
      name: 'Emilia Sexton',
      service: 'Electrical',
      status: 'In-active',
    },
  ];

  return (
    <div className='py-6 pt-8'>
      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        <OverviewCard
          title='Total Complaints'
          count={112}
          icon='/icons/complaint.svg'
          iconAlt='Total complaints icon'
          updatedTime='2 mins ago'
          linkText='View all complaints'
          linkHref='/complaints'
        />

        <OverviewCard
          title='Open complaints'
          count={12}
          icon='/icons/in-progress.svg'
          iconAlt='Open complaints icon'
          updatedTime='2 mins ago'
          linkText='View open complaint'
          linkHref='/complaints/open'
        />

        <OverviewCard
          title='Resolved complaints'
          count={100}
          icon='/icons/completed.svg'
          iconAlt='Resolved complaints icon'
          updatedTime='2 mins ago'
          linkText='View resolved complaint'
          linkHref='/complaints/resolved'
        />

        <OverviewCard
          title='Assigned vendors'
          count={7}
          icon='/icons/user-business.svg'
          iconAlt='Assigned vendors icon'
          updatedTime='2 mins ago'
          linkText='View assigned vendors'
          linkHref='/vendors'
        />
      </div>

      {/* Main Content Area */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8'>
        {/* Complaints Table - Takes 2/3 of the space on large screens */}
        <div className='lg:col-span-3'>
          <ComplaintsTable complaints={complaintsData} />
        </div>

        {/* Vendors List - Takes 1/3 of the space on large screens */}
        <div className='lg:col-span-1'>
          <VendorsList vendors={vendorsData} />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
