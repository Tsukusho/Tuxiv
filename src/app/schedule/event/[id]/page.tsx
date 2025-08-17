'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AvailabilityInput from '@/components/schedule/AvailabilityInput';

export default function EventPage() {
  const params = useParams();
  const eventId = params?.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <AvailabilityInput eventId={eventId} />
    </div>
  );
}