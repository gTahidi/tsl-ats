'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';
import { CandidateView, ProcessStep } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface ProcessStepsTableProps {
  candidateId: string;
  onEdit?: (step: ProcessStep) => void;
  onDelete?: (step: ProcessStep) => void;
}

export default function ProcessStepsTable({
  candidateId,
  onEdit,
  onDelete,
}: ProcessStepsTableProps) {
  const {
    data: candidate,
    isLoading,
  } = useQuery<CandidateView>({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch process steps');
      }
      return response.json();
    },
  });

  const columns: ColumnType<ProcessStep>[] = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: ProcessStep, b: ProcessStep) => a.type.localeCompare(b.type),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
      ],
      onFilter: (value: boolean | Key, record: ProcessStep) => record.status === value,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return format(new Date(date), 'PPP');
      },
      sorter: (a: ProcessStep, b: ProcessStep) => {
        if (typeof window === 'undefined') return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ProcessStep) => (
        <Space size="middle">
          {onEdit && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={candidate?.steps || []}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
}
