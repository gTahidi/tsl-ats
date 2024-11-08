'use client';

import React from 'react';
import { Table, Button, Popconfirm, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { JobView } from '../../types/jobs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface JobsTableProps {
  jobs?: JobView[];
  loading?: boolean;
  onEdit?: (job: JobView) => void;
  onDelete?: (id: string) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({
  jobs: externalJobs,
  loading: externalLoading,
  onEdit: externalOnEdit,
  onDelete: externalOnDelete
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  const deleteJobMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      message.success('Job deleted successfully');
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete job');
    },
  });

  const handleEdit = (job: JobView) => {
    if (externalOnEdit) {
      externalOnEdit(job);
    } else {
      router.push(`/jobs/${job.id}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    if (externalOnDelete) {
      externalOnDelete(id);
    } else {
      deleteJobMutation.mutate(id);
    }
  };

  const columns: ColumnsType<JobView> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Candidates',
      dataIndex: 'candidateCount',
      key: 'candidateCount',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete job"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={externalJobs || jobs || []}
      columns={columns}
      rowKey="id"
      loading={externalLoading || isLoading || deleteJobMutation.isPending}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default JobsTable;
