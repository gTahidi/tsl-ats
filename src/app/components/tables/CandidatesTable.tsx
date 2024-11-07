'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { format } from 'date-fns';

interface Candidate {
  id: string;
  name: string;
  email: string;
  processStatus: string;
  cvUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidatesTableProps {
  candidates: Candidate[];
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function CandidatesTable({
  candidates,
  onEdit,
  onDelete,
  loading = false,
}: CandidatesTableProps) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Candidate, b: Candidate) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: Candidate, b: Candidate) => a.email.localeCompare(b.email),
    },
    {
      title: 'Status',
      dataIndex: 'processStatus',
      key: 'processStatus',
      render: (status: string) => (
        <Tag color={
          status === 'Applied' ? 'blue' :
          status === 'Interviewing' ? 'orange' :
          status === 'Rejected' ? 'red' :
          status === 'Hired' ? 'green' : 'default'
        }>{status}</Tag>
      ),
      filters: [
        { text: 'Applied', value: 'Applied' },
        { text: 'Interviewing', value: 'Interviewing' },
        { text: 'Rejected', value: 'Rejected' },
        { text: 'Hired', value: 'Hired' },
      ],
      onFilter: (value: string | number | boolean, record: Candidate) =>
        record.processStatus === value,
    },
    {
      title: 'CV',
      key: 'cv',
      render: (_: any, record: Candidate) => (
        record.cvUrl ? (
          <Tooltip title="Download CV">
            <Button
              type="link"
              icon={<FilePdfOutlined />}
              onClick={() => window.open(record.cvUrl)}
            />
          </Tooltip>
        ) : null
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
      sorter: (a: Candidate, b: Candidate) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
      sorter: (a: Candidate, b: Candidate) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Candidate) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={candidates}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
}
