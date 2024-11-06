'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepModal from './StepModal';

type Step = {
  id: string;
  type: string;
  status: string;
  notes?: string | null;
  date: Date;
};

type ProcessStepsProps = {
  candidateId: string;
  jobId: string;
  steps: Step[];
};

export default function ProcessSteps({ candidateId, jobId, steps }: ProcessStepsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleAddStep = async (data: { type: string; status: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to add step');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add step');
      throw err;
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Process Steps</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          Add Step
        </button>
      </div>

      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {steps.map((step, stepIdx) => (
            <li key={step.id}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                      ${step.status === 'completed' ? 'bg-green-500' : step.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}>
                      <span className="text-white text-sm">{step.type[0].toUpperCase()}</span>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        {step.type.charAt(0).toUpperCase() + step.type.slice(1)} - {' '}
                        <span className="font-medium">
                          {step.status.charAt(0).toUpperCase() + step.status.slice(1).replace('_', ' ')}
                        </span>
                      </p>
                      {step.notes && <p className="mt-1 text-sm text-gray-600">{step.notes}</p>}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {new Date(step.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <StepModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStep}
      />
    </div>
  );
}
