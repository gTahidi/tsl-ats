'use client';

import React from 'react';
import { Table, Button, Popconfirm, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { JobView } from '../../types/jobs';

interface JobsTableProps {
  jobs: JobView[];
  loading?: boolean;
  onEdit: (job: JobView) => void;
  onDelete: (id: string) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  loading = false,
  onEdit,
  onDelete,
}) => {
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
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Delete job"
            onConfirm={() => onDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={jobs}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default JobsTable;
