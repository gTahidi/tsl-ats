'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Card, Spin } from 'antd';
import type { Persona, Job } from '@/types';
import CandidateForm from '@/app/components/forms/CandidateForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewCandidatePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: personas, isLoading: loadingPersonas } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas');
      const data = await response.json();
      return data.personas || [];
    },
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      return data || [];
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (values: any) => {
      let cvUrl = undefined;

      // Handle file upload first if there's a file
      if (values.cvFile?.[0]) {
        const formData = new FormData();
        formData.append('file', values.cvFile[0].originFileObj);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload CV');
        }

        const uploadResult = await uploadResponse.json();
        cvUrl = uploadResult.url;
      }

      // Then create the candidate with the file URL
      const candidateData = {
        name: values.name,
        email: values.email,
        linkedinUrl: values.linkedinUrl,
        notes: values.notes,
        personaId: values.personaId,
        jobId: params.id,
        cvUrl: cvUrl,
      };

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create candidate');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      router.push(`/jobs/${params.id}/candidates`);
      router.refresh();
    },
    onError: (err) => {
      console.error('Error in createCandidateMutation:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    },
  });

  if (loadingPersonas || loadingJobs) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <Typography.Text style={{ display: 'block', marginTop: '10px' }}>
            Loading data...
          </Typography.Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Typography.Title level={2}>New Candidate</Typography.Title>
      <Card>
        {error && <Typography.Text type="danger" style={{ marginBottom: '16px', display: 'block' }}>{error}</Typography.Text>}
        <CandidateForm
          onSubmit={(values) => {
            return createCandidateMutation.mutateAsync(values);
          }}
          onCancel={() => router.back()}
          personas={personas || []}
          jobs={jobs || []}
          loading={createCandidateMutation.isPending}
          initialValues={{ jobId: params.id, name: '', email: '', personaId: '', notes: '', linkedinUrl: '' }}
        />
      </Card>
    </Card>
  );
}
