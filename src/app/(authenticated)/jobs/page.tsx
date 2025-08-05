'use client';

import React, { useEffect, useState } from 'react';
import { Button, Flex, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import JobsTable from '../../components/tables/JobsTable';
import JobModal from '../../components/JobModal';
import type { JobView } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Page(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<JobView | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (editingJob && !modalVisible) {
      setModalVisible(true);
    }
  }, [editingJob, modalVisible]);

  const {
    mutateAsync: createJob,
    isPending: createPending,
  } = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to create job');
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const {
    mutateAsync: updateJob,
    isPending: updatePending,
  } = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to update job');
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const {
    mutateAsync: deleteJob,
    isPending: deletePending,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      return response.json();
    },
    onSuccess: () => {
      message.success('Job deleted successfully');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete job');
    },
  });

  const handleCreateOrUpdate = async (values: Partial<JobView> & { jdFile?: File }) => {
    if (!values.title || !values.processGroupId) {
      message.error('Title and Process Group are required');
      return;
    }

    const formData = new FormData();

    // Append all simple key-value pairs from the form values
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'jdFile' && value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    // Append the file if it exists
    if (values.jdFile) {
      formData.append('jdFile', values.jdFile);
    }

    try {
      if (editingJob) {
        // For updates, we pass the ID separately
        await updateJob({ id: editingJob.id, formData });
      } else {
        await createJob(formData);
      }

      message.success(`Job ${editingJob ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      setEditingJob(null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save job');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
  };

  const loading = createPending || updatePending || deletePending;

  return (
    <Flex gap="middle" vertical>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3}>
          Jobs
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Job
        </Button>
      </Flex>

      <JobsTable
        loading={loading}
        onEdit={setEditingJob}
        onDelete={handleDelete}
      />

      <JobModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingJob(null);
        }}
        onSubmit={handleCreateOrUpdate}
        job={editingJob}
      />
    </Flex>
  );
}
