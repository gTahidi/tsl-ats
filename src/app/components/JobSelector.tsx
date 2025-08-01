'use client';

import React, { useState } from 'react';
import { Select, Button, message, Space, Spin } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JobView } from '@/types';

interface JobSelectorProps {
  candidateId: string;
  currentJobId: string;
  currentJobTitle: string;
  onSuccess?: () => void;
}

const JobSelector: React.FC<JobSelectorProps> = ({ 
  candidateId, 
  currentJobId, 
  currentJobTitle,
  onSuccess 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(currentJobId);
  const queryClient = useQueryClient();

  // Fetch all available jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery<JobView[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
    enabled: isEditing, // Only fetch when editing
  });

  // Mutation to reassign job
  const reassignMutation = useMutation({
    mutationFn: async (newJobId: string) => {
      const response = await fetch(`/api/candidates/${candidateId}/reassign-job`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newJobId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reassign job');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message || 'Job reassigned successfully');
      setIsEditing(false);
      setSelectedJobId(currentJobId); // Reset selection
      
      // Invalidate candidates query to refresh the table
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      
      onSuccess?.();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to reassign job');
      setSelectedJobId(currentJobId); // Reset selection on error
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setSelectedJobId(currentJobId);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedJobId(currentJobId);
  };

  const handleConfirm = () => {
    if (selectedJobId === currentJobId) {
      setIsEditing(false);
      return;
    }
    
    reassignMutation.mutate(selectedJobId);
  };

  if (!isEditing) {
    return (
      <Space>
        <span>{currentJobTitle}</span>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={handleEdit}
          title="Change job assignment"
        />
      </Space>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 6,
      minWidth: '260px',
      padding: '2px 0'
    }}>
      <Select
        value={selectedJobId}
        onChange={setSelectedJobId}
        style={{ width: 160, flexShrink: 0 }}
        loading={jobsLoading}
        placeholder="Select job..."
        showSearch={false}
        disabled={reassignMutation.isPending}
        options={jobs?.map(job => ({
          value: job.id,
          label: job.title,
        }))}
      />
      <Button
        type="primary"
        size="small"
        onClick={handleConfirm}
        loading={reassignMutation.isPending}
        disabled={jobsLoading || selectedJobId === currentJobId}
        style={{ flexShrink: 0 }}
      >
        ✓
      </Button>
      <Button
        size="small"
        onClick={handleCancel}
        disabled={reassignMutation.isPending}
        style={{ flexShrink: 0 }}
      >
        ✕
      </Button>
    </div>
  );
};

export default JobSelector;
