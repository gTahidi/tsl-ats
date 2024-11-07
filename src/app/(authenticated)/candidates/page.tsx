'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag } from 'antd';
import { PlusOutlined, FileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import RightSidePanel from '@/app/components/RightSidePanel';
import type { Job, Persona } from '@/types';

// Keep existing interface definition for Candidate

export default function CandidatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    initialValues: null,
  });

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Button type="link" onClick={() => router.push(`/candidates/${record.id}`)}>
          {record.persona.name}
        </Button>
      ),
      sorter: (a, b) => a.persona.name.localeCompare(b.persona.name),
    },
    {
      title: 'Job Position',
      key: 'job',
      render: (_, record) => <Tag color="blue">{record.job.title}</Tag>,
      filters: data.map(item => ({ text: item.job.title, value: item.job.id })),
      onFilter: (value, record) => record.job.id === value,
    },
    {
      title: 'CV',
      key: 'cv',
      render: (_, record) => record.cvUrl ? (
        <Button type="link" icon={<FileOutlined />} href={record.cvUrl} target="_blank">
          View CV
        </Button>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => router.push(`/candidates/${record.id}`)}>
            View Details
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Keep existing fetchData, handleCreate, and handleDelete functions

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Create Candidate
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} candidates`,
        }}
      />
      <RightSidePanel
        open={sidePanel.open}
        onClose={() => setSidePanel(prev => ({ ...prev, open: false }))}
        entityType="candidate"
        mode={sidePanel.mode}
        initialValues={sidePanel.initialValues}
        onSubmit={fetchData}
      />
    </div>
  );
}
