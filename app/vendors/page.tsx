'use client';

import React from 'react';
import VendorsTable, { VendorRow } from '@/components/dashboard/VendorsTable';
import ViewVendor from '@/components/dashboard/ViewVendor';
import {
  AddVendorDialog,
  EditVendorDialog,
  VendorFormValues,
} from '@/components/dashboard/VendorForm';

const VendorsPage = () => {
  const initialVendors: VendorRow[] = [
    {
      id: 1,
      name: 'John William',
      email: 'john@wills.com',
      designation: 'Plumbing',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Emilia Sexton',
      email: 'john@wills.com',
      designation: 'Electrician',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'In-active',
    },
    {
      id: 3,
      name: 'Dave Bundeux',
      email: 'john@wills.com',
      designation: 'Carpenter',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Johnathan Adams',
      email: 'john@wills.com',
      designation: 'Painter',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'In-active',
    },
    {
      id: 5,
      name: 'Emilie Theo',
      email: 'john@wills.com',
      designation: 'Tiler',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Active',
    },
    {
      id: 6,
      name: 'Sylvie Carpenter',
      email: 'john@wills.com',
      designation: 'Electrician',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Assigned',
    },
    {
      id: 7,
      name: 'Anthony Dexter',
      email: 'john@wills.com',
      designation: 'Carpenter',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Active',
    },
    {
      id: 8,
      name: 'Natalie Ruud',
      email: 'john@wills.com',
      designation: 'Electrician',
      registeredOn: 'Apr 12, 2023 - 14:00',
      status: 'Active',
    },
  ];

  const [vendors, setVendors] = React.useState<VendorRow[]>(initialVendors);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<VendorRow | null>(null);

  const handleAdd = (values: VendorFormValues) => {
    const now = new Date();
    const formatted = now.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const row: VendorRow = {
      id: Math.random().toString(36).slice(2, 9),
      name: values.name.trim(),
      email: values.email.trim(),
      designation: values.designation.trim(),
      registeredOn: formatted,
      status: 'Active',
    };
    setVendors((list) => [row, ...list]);
    setAddOpen(false);
  };

  const handleEdit = (values: VendorFormValues) => {
    if (!selected) return;
    setVendors((list) =>
      list.map((v) =>
        v.id === selected.id
          ? {
              ...v,
              ...values,
              name: values.name.trim(),
              email: values.email.trim(),
              designation: values.designation.trim(),
            }
          : v
      )
    );
    setEditOpen(false);
    setViewOpen(false);
  };

  return (
    <div className='py-6 pt-8'>
      <VendorsTable
        vendors={vendors}
        onAddVendor={() => setAddOpen(true)}
        onViewVendor={(v) => {
          setSelected(v);
          setViewOpen(true);
        }}
        onEditVendor={(v) => {
          setSelected(v);
          setEditOpen(true);
        }}
        onDeleteVendor={(v) => {
          // Placeholder: in real app, confirm and delete
          console.log('Delete vendor', v.id);
          setVendors((list) => list.filter((x) => x.id !== v.id));
        }}
      />

      <ViewVendor
        vendor={selected}
        open={viewOpen}
        onOpenChange={(o) => setViewOpen(o)}
        onEdit={(v) => {
          setSelected(v);
          setEditOpen(true);
        }}
        onDelete={(v) => {
          console.log('Delete vendor', v.id);
          setViewOpen(false);
        }}
      />

      <AddVendorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      <EditVendorDialog
        vendor={selected}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
    </div>
  );
};

export default VendorsPage;
