'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import JobsTable from '../../components/tables/JobsTable';
import JobModal from '../../components/JobModal';
import type { JobView } from '../../types/jobs';

export default function Page(): JSX.Element {
  const [jobs, setJobs] = useState<JobView[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<JobView | null>(null);

  const handleCreateOrUpdate = async (values: Partial<JobView>) => {
    if (!values.title || !values.description) return;

    const newJob: JobView = editingJob ? {
      ...editingJob,
      ...values,
      updatedAt: new Date().toISOString()
    } : {
      id: Date.now().toString(),
      title: values.title,
      description: values.description,
      linkedinUrl: values.linkedinUrl || '',
      status: values.status || 'active',
      candidateCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJobs(prev => editingJob
      ? prev.map(job => job.id === editingJob.id ? newJob : job)
      : [...prev, newJob]
    );

    message.success(`Job ${editingJob ? 'updated' : 'created'} successfully`);
    setModalVisible(false);
    setEditingJob(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      // In a real implementation, we would make an API call here
      setJobs(prev => prev.filter(job => job.id !== id));
      message.success('Job deleted successfully');
    } catch (error) {
      message.error('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Job
        </Button>
      </div>

      <JobsTable
        jobs={jobs}
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
    </div>
  );
}
