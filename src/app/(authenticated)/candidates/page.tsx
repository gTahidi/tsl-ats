'use client';

import { useState, useCallback } from 'react';
import { Table, Button, Space, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, FileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import RightSidePanel from '@/app/components/RightSidePanel';
import type { Job, Persona } from '@/types';

interface Candidate {
  id: string;
  linkedinUrl?: string;
  cvUrl?: string;
  notes?: string;
  persona: Persona;
  job: Job;
  createdAt: string;
  updatedAt: string;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Candidate[]>([]);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    initialValues: null as Candidate | null,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/candidates');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const candidates = await response.json();
      setData(candidates);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = () => {
    setSidePanel({
      open: true,
      mode: 'create',
      initialValues: null,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete candidate');
      message.success('Candidate deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to delete candidate');
    }
  };

  const columns: ColumnsType<Candidate> = [
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
      onFilter: (value, record) => record.job.id === String(value),
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
