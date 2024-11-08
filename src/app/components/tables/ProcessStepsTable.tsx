'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ProcessStepsTableProps {
  steps: ProcessStep[];
  onEdit?: (step: ProcessStep) => void;
  onDelete?: (step: ProcessStep) => void;
  loading?: boolean;
}

export default function ProcessStepsTable({
  steps,
  onEdit,
  onDelete,
  loading = false,
}: ProcessStepsTableProps) {
  const columns: ColumnType<ProcessStep>[] = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      sorter: (a: ProcessStep, b: ProcessStep) => a.order - b.order,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProcessStep, b: ProcessStep) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) =>
        text.length > 100 ? `${text.substring(0, 100)}...` : text,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status.toLowerCase()}
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
      render: (date: string) => format(new Date(date), 'PPP'),
      sorter: (a: ProcessStep, b: ProcessStep) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
      dataSource={steps}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
}
