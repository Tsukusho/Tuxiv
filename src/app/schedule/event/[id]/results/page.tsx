'use client';

import React from 'react';
import ResultsDashboard from '@/components/schedule/ResultsDashboard';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const eventId = params.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <ResultsDashboard eventId={eventId} />
    </div>
  );
}