'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { CandidateView, ProcessStep, ProcessStepTemplate } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RatingTag from '../RatingTag';

interface ProcessStepsTableProps {
  candidateId: string;
  onEdit?: (step: ProcessStep) => void;
  onDelete?: (step: ProcessStep) => void;

  templateSelected?: ProcessStepTemplate;
  onTemplateSelect?: (step: ProcessStepTemplate) => void;
}

export default function ProcessStepsTable({
  candidateId,
  templateSelected: template,
  onTemplateSelect: onSelect,
}: ProcessStepsTableProps) {
  const qc = useQueryClient();

  const {
    data: candidate,
    isLoading,
  } = useQuery<CandidateView>({
    queryKey: ['candidates', candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch process steps');
      }
      return response.json();
    },
  });

  const {
    mutate: updateCandidate,
    isPending: updatePending,
  } = useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to update process step');
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const groupSteps = candidate?.job.processGroup?.steps || [];
  const currStep = candidate?.currentStep;

  const columns: ColumnType<ProcessStepTemplate>[] = [
    {
      title: '#',
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
      title: 'Date',
      key: 'date',
      render: (record: ProcessStepTemplate) => {
        const step = candidate?.steps?.find(step => step.templateId === record.id);
        return (
          step?.date ? new Date(step.date).toLocaleDateString() : '-'
        )
      }
    },
    {
      title: 'Step rating',
      key: 'rating',
      render: (record: ProcessStepTemplate) => {
        const step = candidate?.steps?.find(step => step.templateId === record.id);
        return <RatingTag rating={step?.rating} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (rec: ProcessStepTemplate) => {
        return (
          <Space>
            {currStep && (
              <Tooltip title={rec.order <= currStep.template.order ? 'Step already completed' : 'Mark step as current'}>
                <Button
                  loading={rec.order <= currStep.template.order && updatePending}
                  disabled={rec.order <= currStep.template.order || updatePending}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    updateCandidate({
                      currentStep: {
                        groupId: currStep.groupId,
                        templateId: rec.id,
                      },
                    });
                  }}
                />
              </Tooltip>
            )}
            {onSelect && rec.id !== template?.id && (
              <Tooltip title="See details">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    onSelect(rec);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={groupSteps}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
}
