'use client';

import React from 'react';
import { Table, Button, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Persona } from '../../../types';
import { useQuery } from '@tanstack/react-query';
import PersonaCvsButton from '../persona-cvs-button';

const { Title } = Typography;

interface PersonasTableProps {
  loading?: boolean;
  onEdit?: (persona: Persona) => void;
  onDelete?: (id: string) => void;
}

const PersonasTable: React.FC<PersonasTableProps> = ({
  loading: externalLoading,
  onEdit: externalOnEdit,
  onDelete: externalOnDelete
}) => {
  const { data: personas, isLoading } = useQuery<Persona[]>({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas');
      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }
      return response.json();
    },
  });

  const columns: ColumnsType<Persona> = [
    {
      title: 'Full Name',
      key: 'fullName',
      sorter: (a, b) => `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`),
      render: (_, record) => `${record.name} ${record.surname}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => {
        if (!location) {
          return '-';
        }

        return location
      },
      ellipsis: true,
    },
    {
      title: 'LinkedIn URL',
      dataIndex: 'linkedinUrl',
      key: 'linkedinUrl',
      render: (linkedinUrl) => {
        if (!linkedinUrl) {
          return '-';
        }

        return (
          <a href={linkedinUrl} target="_blank" rel="noreferrer">
            Go to LinkedIn
          </a>
        )
      },
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="text" icon={<EditOutlined />} onClick={() => externalOnEdit?.(record)} disabled={!externalOnEdit} />
          <Popconfirm
            title="Delete persona"
            onConfirm={() => externalOnDelete?.(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={!externalOnDelete} />
          </Popconfirm>
          <PersonaCvsButton personaId={record.id} buttonText="View CVs" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Personas ({personas?.length || 0})
      </Title>
      <Table
        dataSource={personas || []}
        columns={columns}
        rowKey="id"
        loading={externalLoading || isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default PersonasTable;
