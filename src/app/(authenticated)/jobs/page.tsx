'use client';

import React, { useEffect, useState } from 'react';
import { Button, Flex, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import JobsTable from '../../components/tables/JobsTable';
import JobModal from '../../components/JobModal';
import type { JobView } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Page(): JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<JobView | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (editingJob && !modalVisible) {
      setModalVisible(true);
    }
  }, [editingJob, modalVisible]);

  const {
    mutateAsync: updateJob,
    isPending: updatePending,
  } = useMutation({
    mutationFn: async (job: JobView) => {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
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

  const handleCreateOrUpdate = async (values: Partial<JobView>) => {
    if (!values.title) {
      message.error('Title is required');
      return;
    }

    const now = new Date();

    const newJob: JobView = editingJob ? {
      ...editingJob,
      ...values,
      updatedAt: now,
      candidates: undefined,
      processGroup: undefined,
    } : {
      id: crypto.randomUUID(),
      title: values.title,
      description: values.description,
      linkedinUrl: values.linkedinUrl,
      status: values.status || 'Open',
      processGroupId: values.processGroupId,
      processGroup: undefined,
      createdAt: now,
      updatedAt: now,
      candidates: undefined,
    };

    try {
      await updateJob(newJob);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to update job');
      return;
    }

    message.success(`Job ${editingJob ? 'updated' : 'created'} successfully`);
    setModalVisible(false);
    setEditingJob(null);
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
  };

  const loading = updatePending || deletePending;

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
