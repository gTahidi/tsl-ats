'use client';

import { Table, Space, Button, Tag, Tooltip, Typography } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { CandidateView, ProcessStep, ProcessStepTemplate } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RatingTag from '../RatingTag';

const { Title } = Typography;

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
  
  // Determine current step: find the first pending step or the last completed step
  const currStep = candidate?.steps ? (
    candidate.steps.find(step => step.status === 'Pending') ||
    candidate.steps
      .filter(step => step.status === 'Completed')
      .sort((a, b) => b.template.order - a.template.order)[0]
  ) : null;

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
      sorter: (a, b) => {
        const stepA = candidate?.steps?.find(step => step.templateId === a.id);
        const stepB = candidate?.steps?.find(step => step.templateId === b.id);

        return new Date(stepA?.date || 0).getTime() - new Date(stepB?.date || 0).getTime();
      },
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
        return <RatingTag rating={step?.rating?.matchScore || null} />;
      },
      sorter: (a, b) => {
        const stepA = candidate?.steps?.find(step => step.templateId === a.id);
        const stepB = candidate?.steps?.find(step => step.templateId === b.id);

        const ratingA = stepA?.rating?.matchScore || 0;
        const ratingB = stepB?.rating?.matchScore || 0;
        return ratingA - ratingB;
      },
      filters: [
        { text: 'Not rated', value: 'Not rated' },
        { text: 'Strong no hire', value: 'Strong no hire' },
        { text: 'No hire', value: 'No hire' },
        { text: 'Maybe', value: 'Maybe' },
        { text: 'Hire', value: 'Hire' },
        { text: 'Strong hire', value: 'Strong hire' },
      ],
      onFilter: (value, record) => {
        const step = candidate?.steps?.find(step => step.templateId === record.id);
        const rating = step?.rating?.matchScore;
        
        if (!rating) {
          return value === 'Not rated';
        }
        
        // Convert numeric rating to category
        let category = 'Not rated';
        if (rating >= 90) {
          category = 'Strong hire';
        } else if (rating >= 75) {
          category = 'Hire';
        } else if (rating >= 60) {
          category = 'Maybe';
        } else if (rating >= 40) {
          category = 'No hire';
        } else {
          category = 'Strong no hire';
        }
        
        return category === value;
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
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Process Steps ({groupSteps?.length || 0})
      </Title>
      <Table
        columns={columns}
        dataSource={groupSteps}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
