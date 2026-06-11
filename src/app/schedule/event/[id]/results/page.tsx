'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ResultsDashboard from './_components/ResultsDashboard';

export default function ResultsPage() {
  const params = useParams();
  const eventId = params?.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <ResultsDashboard eventId={eventId} />
    </div>
  );
}