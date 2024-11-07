'use client';

import { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CreatePersonaModal from './CreatePersonaModal';

interface Persona {
  id: string;
  name: string;
  email: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  candidates: any[];
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns: ColumnsType<Persona> = [
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
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Candidates',
      dataIndex: 'candidates',
      key: 'candidates',
      render: (candidates) => candidates?.length || 0,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      const data = await response.json();
      setPersonas(data.personas);
    } catch (error) {
      console.error('Failed to fetch personas:', error);
      message.error('Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersona = async (values: any) => {
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to create persona');

      await fetchPersonas();
      message.success('Persona created successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create persona:', error);
      message.error('Failed to create persona');
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Personas</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Persona
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={personas}
        rowKey="id"
        loading={loading}
      />

      <CreatePersonaModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleCreatePersona}
      />
    </div>
  );
}
