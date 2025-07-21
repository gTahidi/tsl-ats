'use client';

import React from 'react';
import { Table, Button, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProcessGroup } from '../../../types';
import { useQuery } from '@tanstack/react-query';

const { Title } = Typography;

interface groupsTableProps {
  loading?: boolean;
  onEdit?: (group: ProcessGroup) => void;
  onDelete?: (id: string) => void;
}

const GroupsTable: React.FC<groupsTableProps> = ({
  loading: externalLoading,
  onEdit: externalOnEdit,
  onDelete: externalOnDelete
}) => {
  const { data: groups, isLoading } = useQuery<ProcessGroup[]>({
    queryKey: ['processGroups'],
    queryFn: async () => {
      const response = await fetch('/api/process-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return response.json();
    },
  });

  const columns: ColumnsType<ProcessGroup> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Steps',
      key: 'steps',
      render: (_, record) => record.steps?.length || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="text" icon={<EditOutlined />} onClick={() => externalOnEdit?.(record)} disabled={!externalOnEdit} />
          <Popconfirm
            title="Delete group"
            onConfirm={() => externalOnDelete?.(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={!externalOnDelete} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Process Groups ({groups?.length || 0})
      </Title>
      <Table
        dataSource={groups || []}
        columns={columns}
        rowKey="id"
        loading={externalLoading || isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default GroupsTable;
