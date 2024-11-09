'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';
import { CandidateView, ProcessStep, ProcessStepTemplate } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface ProcessStepsTableProps {
  candidateId: string;
  onEdit?: (step: ProcessStep) => void;
  onDelete?: (step: ProcessStep) => void;
}

export default function ProcessStepsTable({
  candidateId,
  onEdit,
  onDelete,
}: ProcessStepsTableProps) {
  const {
    data: candidate,
    isLoading,
  } = useQuery<CandidateView>({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch process steps');
      }
      return response.json();
    },
  });

  const columns: ColumnType<ProcessStepTemplate>[] = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      sorter: (a: ProcessStepTemplate, b: ProcessStepTemplate) => a.order - b.order,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProcessStepTemplate, b: ProcessStepTemplate) => a.name.localeCompare(b.name),
    },
    {
      title: 'Completed',
      key: 'completed',
      render: (record: ProcessStepTemplate) => {
        const tId = candidate?.currentStep?.templateId;

        if (record.id === tId) {
          return (
            <Tag color="green">
              Yes
            </Tag>
          );
        }

        return (
          <Tag color="red">
            No
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (rec: ProcessStepTemplate) => {
        const tId = candidate?.currentStep?.templateId;

        return (
          <Space>
            <Tooltip title="Mark as completed">
              <Button
                disabled={rec.id === tId}
                icon={<CheckOutlined />}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={candidate?.currentStep?.group?.steps || []}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
}
