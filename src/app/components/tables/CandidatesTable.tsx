'use client';

import React from 'react';
import { Table, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CandidateView } from '../../types';

interface CandidatesTableProps {
  candidates: CandidateView[];
  onEdit: (candidate: CandidateView) => void;
  onDelete: (candidate: CandidateView) => void;
  loading?: boolean;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  onEdit,
  onDelete,
  loading = false,
}) => {
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
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Delete candidate"
            description="Are you sure?"
            onConfirm={() => onDelete(record)}
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
      dataSource={candidates}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
};

export default CandidatesTable;
