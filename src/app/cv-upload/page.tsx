'use client';

import React from 'react';
import { Flex, Typography, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import CvUploadForm from './_components/cv-upload-form';
import type { JobView } from '../../types';

export default function CvUploadPage() {
  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery<JobView[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }}>
        <Alert
          message="Error loading jobs"
          description="Failed to load job listings. Please try again."
          type="error"
          showIcon
        />
      </Flex>
    );
  }

  return (
    <Flex gap="middle" vertical>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3}>
          Upload CV
        </Typography.Title>
      </Flex>
      
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <Typography.Paragraph style={{ marginBottom: '24px', color: '#666' }}>
          Select a job posting and upload a CV file to automatically parse and create a new candidate profile.
        </Typography.Paragraph>
        <CvUploadForm jobs={jobs || []} />
      </div>
    </Flex>
  );
}
