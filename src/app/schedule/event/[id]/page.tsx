'use client';

import React from 'react';
import AvailabilityInput from '@/components/schedule/AvailabilityInput';

export default function EventPage({ params }: { params: { id: string } }) {
  const eventId = params.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <AvailabilityInput eventId={eventId} />
    </div>
  );
}