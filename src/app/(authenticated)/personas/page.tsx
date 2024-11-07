'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RightSidePanel from '@/app/components/RightSidePanel';
import type { Persona } from '@/types';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  {
    title: 'Notes',
    dataIndex: 'notes',
    key: 'notes',
    ellipsis: true,
    render: (text: string) => text || '-'
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_: any, record: Persona) => (
      <Space>
        <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
        <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
      </Space>
    ),
  },
];

export default function PersonasPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Persona[]>([]);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    initialValues: null,
  });

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personas');
      if (!response.ok) throw new Error('Failed to fetch personas');
      const personas = await response.json();
      setData(personas);
    } catch (error) {
      message.error('Failed to fetch personas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPersonas(); }, []);

  const handleCreate = () => setSidePanel({ open: true, mode: 'create', initialValues: null });
  const handleEdit = (record: Persona) => setSidePanel({ open: true, mode: 'edit', initialValues: record });
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/personas/${id}`, { method: 'DELETE' });
      message.success('Persona deleted successfully');
      fetchPersonas();
    } catch (error) {
      message.error('Failed to delete persona');
    }
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Create Persona
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} personas`
        }}
      />
      <RightSidePanel
        open={sidePanel.open}
        onClose={() => setSidePanel(prev => ({ ...prev, open: false }))}
        entityType="persona"
        mode={sidePanel.mode}
        initialValues={sidePanel.initialValues}
        onSubmit={fetchPersonas}
      />
    </div>
  );
}
