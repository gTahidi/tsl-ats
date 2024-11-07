'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, LinkedinOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  status: string;
  linkedinUrl?: string;
  candidateCount: number;
  createdAt: string;
  updatedAt: string;
}

interface JobsTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function JobsTable({
  jobs,
  onEdit,
  onDelete,
  loading = false,
}: JobsTableProps) {
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Job, b: Job) => a.title.localeCompare(b.title),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'Open' ? 'green' :
          status === 'Closed' ? 'red' :
          status === 'Draft' ? 'default' :
          'blue'
        }>{status}</Tag>
      ),
      filters: [
        { text: 'Open', value: 'Open' },
        { text: 'Closed', value: 'Closed' },
        { text: 'Draft', value: 'Draft' },
      ],
      onFilter: (value: string | number | boolean, record: Job) =>
        record.status === value,
    },
    {
      title: 'LinkedIn',
      key: 'linkedin',
      render: (_: any, record: Job) => (
        record.linkedinUrl ? (
          <Tooltip title="View on LinkedIn">
            <Button
              type="link"
              icon={<LinkedinOutlined />}
              onClick={() => window.open(record.linkedinUrl)}
            />
          </Tooltip>
        ) : null
      ),
    },
    {
      title: 'Candidates',
      dataIndex: 'candidateCount',
      key: 'candidateCount',
      sorter: (a: Job, b: Job) => a.candidateCount - b.candidateCount,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
      sorter: (a: Job, b: Job) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
      sorter: (a: Job, b: Job) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Job) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
              disabled={record.candidateCount > 0}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} jobs`,
      }}
    />
  );
}
