'use client';

import React from 'react';
import { Table, Button, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CandidateView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CandidatesTableProps {
  jobId?: string;
  candidates?: CandidateView[];
  loading?: boolean;
  onEdit?: (candidate: CandidateView) => void;
  onDelete?: (candidate: CandidateView) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ jobId, candidates, loading, onEdit, onDelete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: fetchedCandidates, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: async () => {
      const url = jobId ? `/api/jobs/${jobId}/candidates` : '/api/candidates';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      return response.json();
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      message.success('Candidate deleted successfully');
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete candidate');
    },
  });

  const handleRowClick = (record: CandidateView) => {
    const basePath = jobId ? `/jobs/${jobId}/candidates` : '/candidates';
    router.push(`${basePath}/${record.id}`);
  };

  const handleEdit = (record: CandidateView) => {
    if (onEdit) {
      onEdit(record);
    } else {
      const basePath = jobId ? `/jobs/${jobId}/candidates` : '/candidates';
      router.push(`${basePath}/${record.id}/edit`);
    }
  };

  const handleDelete = (record: CandidateView) => {
    if (onDelete) {
      onDelete(record);
    } else {
      deleteCandidateMutation.mutate(record.id);
    }
  };

  const columns: ColumnsType<CandidateView> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Job',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete candidate"
            description="Are you sure?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={candidates || fetchedCandidates || []}
      columns={columns}
      rowKey="id"
      loading={loading || isLoading || deleteCandidateMutation.isPending}
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
};

export default CandidatesTable;
