'use client';

import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CandidatesTable from '../../components/tables/CandidatesTable';
import CandidateModal from '../../components/CandidateModal';
import type { CandidateView } from '@/types';

export default function Page(): JSX.Element {
  const [candidates, setCandidates] = useState<CandidateView[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateView | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/candidates');
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      message.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      const url = editingCandidate
        ? `/api/candidates/${editingCandidate.id}`
        : '/api/candidates';
      const method = editingCandidate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save candidate');

      message.success(`Candidate ${editingCandidate ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchCandidates();
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

      message.success('Candidate deleted successfully');
      fetchCandidates();
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Candidate
        </Button>
      </div>

      <CandidatesTable
        candidates={candidates}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CandidateModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleCreateOrUpdate}
        candidate={editingCandidate}
      />
    </div>
  );
}
