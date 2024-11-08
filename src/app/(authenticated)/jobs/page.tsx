'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import RightSidePanel from '@/app/components/RightSidePanel';
import type { Job } from '@/types';

export default function JobsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Job[]>([]);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    initialValues: null as Job | null,
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const jobs = await response.json();
      setData(jobs);
    } catch (error) {
      message.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = () => setSidePanel({ open: true, mode: 'create', initialValues: null });
  const handleEdit = (record: Job) => setSidePanel({ open: true, mode: 'edit', initialValues: record });
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      message.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      message.error('Failed to delete job');
    }
  };

  const columns: ColumnsType<Job> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Job, b: Job) => a.title.localeCompare(b.title)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Open', value: 'Open' },
        { text: 'Closed', value: 'Closed' },
        { text: 'On Hold', value: 'On Hold' },
      ],
      onFilter: (value, record) => record.status === value.toString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Job) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Create Job
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} jobs`,
        }}
      />
      <RightSidePanel
        open={sidePanel.open}
        onClose={() => setSidePanel(prev => ({ ...prev, open: false }))}
        entityType="job"
        mode={sidePanel.mode}
        initialValues={sidePanel.initialValues}
        onSubmit={fetchJobs}
      />
    </div>
  );
}
