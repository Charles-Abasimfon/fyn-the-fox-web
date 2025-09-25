import React from 'react';
import WorkOrdersTable, {
  WorkOrder,
} from '@/components/dashboard/WorkOrdersTable';

const WorkOrdersPage = () => {
  const data: WorkOrder[] = [
    {
      id: 1,
      name: 'John William',
      complaint: 'I am having a leaking faucet',
      propertyAddress: '1234 Elm St. Spring Field',
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
      complaint:
        'I do not have hot water running and also I have some electrical issues',
      propertyAddress: '5678 Oak Ave, Riverside',
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
      complaint:
        'I am having a leaking faucet and my toilet water is not running',
      propertyAddress: '9101 Maple Dr, Lake City',
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
      complaint:
        'I do not have hot water and also I have some electrical issues',
      propertyAddress: '2345 Pine Ln, Hill Town',
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
      complaint:
        'I am having a leaking faucet and my toilet water is not running',
      propertyAddress: '6789 Cedar Ct, Green Ville',
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
      complaint:
        'I do not have hot water running and also I have some electrical issues',
      propertyAddress: '3456 Birch Blvd, Madison',
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
      complaint:
        'I am having a leaking faucet and my toilet water is not running',
      propertyAddress: '7890 Spruce Way, South Park',
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
      complaint:
        'I do not have hot water running and also I have some electrical issues',
      propertyAddress: '4567 Willow Pl, Crestwood',
      units: '03',
      assignedTo: 'Emilia Sexton',
      assignedRole: 'Electrician',
      scheduledDate: 'Apr 12, 2023',
      scheduledTime: '14:00',
      status: 'Pending vendors acceptance',
    },
  ];

  return (
    <div className='py-6 pt-8'>
      <WorkOrdersTable workOrders={data} />
    </div>
  );
};

export default WorkOrdersPage;
