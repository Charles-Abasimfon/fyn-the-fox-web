'use client';
import React from 'react';

export default function HospitalityOverviewPage() {
  return (
    <div className='py-6 pt-8 text-white'>
      <h1 className='text-2xl font-semibold mb-6'>Hospitality Dashboard</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <div className='text-sm text-white/70'>Reservations (Today)</div>
          <div className='text-3xl font-bold mt-2'>0</div>
        </div>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <div className='text-sm text-white/70'>Table Utilization</div>
          <div className='text-3xl font-bold mt-2'>0%</div>
        </div>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <div className='text-sm text-white/70'>Event Inquiries</div>
          <div className='text-3xl font-bold mt-2'>0</div>
        </div>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <div className='text-sm text-white/70'>Upsell Conversions</div>
          <div className='text-3xl font-bold mt-2'>0</div>
        </div>
      </div>

      <div className='mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <h2 className='text-lg font-medium mb-3'>Recent Conversations</h2>
          <p className='text-white/70 text-sm'>
            Call & Chat logs will appear here with transcripts and escalation
            flags.
          </p>
        </div>
        <div className='bg-[#FFFFFF0D] rounded-lg p-6 border border-white/10'>
          <h2 className='text-lg font-medium mb-3'>AI Insights</h2>
          <p className='text-white/70 text-sm'>
            Narrative summaries and recommendations will be generated here.
          </p>
        </div>
      </div>
    </div>
  );
}
