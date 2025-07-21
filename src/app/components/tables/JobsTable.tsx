'use client';

import React from 'react';
import { Table, Button, Popconfirm, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { JobView } from '../../../types';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const { Title } = Typography;

interface JobsTableProps {
  loading?: boolean;
  onEdit?: (job: JobView) => void;
  onDelete?: (id: string) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({
  loading: externalLoading,
  onEdit: externalOnEdit,
  onDelete: externalOnDelete
}) => {
  const router = useRouter();

  const { data: jobs, isLoading } = useQuery<JobView[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  const handleRowClick = (record: JobView) => {
    router.push(`jobs/${record.id}`);
  };

  const columns: ColumnsType<JobView> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Open' ? 'green' : 'yellow'}>
          {status.toUpperCase()}
        </Tag>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Process',
      key: 'process',
      render: (_, record: JobView) => (
        <Tag color="cyan">
          {record.processGroup?.name || "-"}
        </Tag>
      ),
    },
    {
      title: 'Candidates',
      key: 'candidates',
      render: (_, record: JobView) => (
        <span>
          {record.candidates?.length || 0}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleRowClick(record)}
          />
          <Button type="text" icon={<EditOutlined />} onClick={() => externalOnEdit?.(record)} disabled={!externalOnEdit} />
          <Popconfirm
            title="Delete job"
            onConfirm={() => externalOnDelete?.(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={!externalOnDelete} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Jobs ({jobs?.length || 0})
      </Title>
      <Table
        dataSource={jobs || []}
        columns={columns}
        rowKey="id"
        loading={externalLoading || isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default JobsTable;
