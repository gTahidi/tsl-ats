'use client';

import React, { useState } from 'react';
import { Button, Flex, Typography, message, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CandidatesTable from '../../components/tables/CandidatesTable';
import CandidateModal from '../../components/CandidateModal';
import type { CandidateView, JobView } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Page(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateView | null>(null);
  const qc = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const { data: jobs, isLoading: isLoadingJobs } = useQuery<JobView[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      return data.jobs;
    },
  });

  const handleCreateOrUpdate = async (values: Partial<CandidateView>) => {
    try {
      const url = editingCandidate
        ? `/api/candidates/${editingCandidate.id}`
        : '/api/candidates';

      const method = editingCandidate ? 'PUT' : 'POST';
      const now = new Date();

      values.updatedAt = now;

      if (!editingCandidate) {
        values.createdAt = now;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save candidate');

      qc.invalidateQueries({ queryKey: ['candidates'] });
      message.success(`Candidate ${editingCandidate ? 'updated' : 'created'} successfully`);

      setModalVisible(false);
      setEditingCandidate(null);
    } catch (error) {
      message.error('Failed to save candidate');
    }
  };

  const handleDelete = async (candidate: CandidateView) => {
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete candidate');

      qc.invalidateQueries({ queryKey: ['candidates'] });
      message.success('Candidate deleted successfully');

      setEditingCandidate(null);
    } catch (error) {
      message.error('Failed to delete candidate');
    }
  };

  const handleEdit = (candidate: CandidateView) => {
    setEditingCandidate(candidate);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingCandidate(null);
  };

  return (
    <Flex gap="middle" vertical>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3}>
          Candidates
        </Typography.Title>
        <Flex align="center" gap="middle">
          <Select
            placeholder="Filter by job"
            style={{ width: 250 }}
            allowClear
            loading={isLoadingJobs}
            onChange={setSelectedJobId}
            options={jobs?.map((job) => ({ label: job.title, value: job.id }))}
            value={selectedJobId}
          />
          {/* <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Add Candidate
          </Button> */}
        </Flex>
      </Flex>

      <CandidatesTable
        jobId={selectedJobId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CandidateModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleCreateOrUpdate}
        candidate={editingCandidate}
      />
    </Flex>
  );
}
