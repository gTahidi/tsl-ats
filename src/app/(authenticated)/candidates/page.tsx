'use client';

import React, { useState } from 'react';
import { Button, Flex, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CandidatesTable from '../../components/tables/CandidatesTable';
import CandidateModal from '../../components/CandidateModal';
import type { CandidateView } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export default function Page(): JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateView | null>(null);
  const qc = useQueryClient();

  const handleCreateOrUpdate = async (values: Partial<CandidateView>) => {
    try {
      const url = editingCandidate
        ? `/api/candidates/${editingCandidate.id}`
        : '/api/candidates';

      const method = editingCandidate ? 'PUT' : 'POST';
      const now = new Date();

      if (!editingCandidate) {
        values.steps = [
          {
            id: crypto.randomUUID(),
            type: 'Backlog',
            status: 'Pending',
            createdAt: now,
            updatedAt: now,
            candidateId: values.id!,
          } as any
        ];
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Candidate
        </Button>
      </Flex>

      <CandidatesTable
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
