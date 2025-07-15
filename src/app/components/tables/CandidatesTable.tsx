'use client';

import React from 'react';
import { Table, Button, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { CandidateView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RatingTag from '../RatingTag';

interface CandidatesTableProps {
  jobId?: string;
  loading?: boolean;
  onEdit?: (candidate: CandidateView) => void;
  onDelete?: (candidate: CandidateView) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ jobId, loading, onEdit, onDelete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: fetchedCandidates, isLoading } = useQuery({
    queryKey: ['candidates', 'byJob', jobId],
    queryFn: async () => {
      const url = `/api/candidates${jobId ? `?jobId=${jobId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      return response.json();
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      message.success('Candidate deleted successfully');
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete candidate');
    },
  });

  const handleRowClick = (record: CandidateView) => {
    router.push(`/candidates/${record.id}`);
  };

  const columns: ColumnsType<CandidateView> = [
    {
      title: 'Full name',
      key: 'fullName',
      render: (record) => `${record.persona.name} ${record.persona.surname}`,
      sorter: (a, b) => {
        // Compare first by name, then by surname
        const nameComparison = a.persona.name.localeCompare(b.persona.name);
        if (nameComparison !== 0) {
          return nameComparison;
        }
        return a.persona.surname.localeCompare(b.persona.surname);
      }
    },
    {
      title: 'Email',
      key: 'email',
      render: (record) => record.persona.email,
      ellipsis: true,
    },
    ...(!jobId ?
      [
        {
          title: 'Job',
          key: 'jobTitle',
          render: (record: CandidateView) => record.job.title,
        },
      ] : []
    ),
    {
      title: 'CV',
      key: 'cvUrl',
      render: (record: CandidateView) => {
        if (!record.cvFileKey) {
          return '-';
        }

        return <CVButton id={record.id} />
      }
    },
    {
      title: 'Step',
      key: 'step',
      sorter: (a, b) => {
        if (!a.currentStep || !b.currentStep) {
          return 0;
        }

        return a.currentStep.template.order - b.currentStep.template.order;
      },
      render: (record: CandidateView) => {
        const step = record.currentStep

        if (!step) {
          return '-';
        }

        return (
          <span>
            {step.template.order} - {step.template.name}
          </span>
        )
      }
    },
    {
      title: 'Rating',
      key: 'rating',
      sorter: (a, b) => {
        const ratings = ['Not rated', 'Strong no hire', 'No hire', 'Maybe', 'Hire', 'Strong hire'];
        return ratings.indexOf(a.rating || 'Not rated') - ratings.indexOf(b.rating || 'Not rated');
      },
      filters: [
        { text: 'Not rated', value: false },
        { text: 'Strong no hire', value: 'Strong no hire' },
        { text: 'No hire', value: 'No hire' },
        { text: 'Maybe', value: 'Maybe' },
        { text: 'Hire', value: 'Hire' },
        { text: 'Strong hire', value: 'Strong hire' },
      ],
      // Strong nos out
      defaultFilteredValue: [
        'Not rated',
        'No hire',
        'Maybe',
        'Hire',
        'Strong hire',
      ],
      onFilter: (value, record) => record.rating === value,
      render: (record: CandidateView) => {
        return <RatingTag rating={record.rating} />;
      }
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => {
        if (typeof window === 'undefined') return date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleRowClick(record)}
          />
          {onEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          )}
          {onDelete && (
            <Popconfirm
              title="Delete candidate"
              description="Are you sure?"
              onConfirm={() => onDelete?.(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={fetchedCandidates || []}
      columns={columns}
      rowKey="id"
      loading={loading || isLoading || deleteCandidateMutation.isPending}
      pagination={{
        defaultPageSize: 25,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
};

const CVButton = ({ id }: { id: string }) => {
  const {
    data: cvData,
    isPending,
    error,
  } = useQuery<{ url: string | null }>({
    queryKey: ['candidate-cv', id],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${id}/cv-azure`);
      if (!response.ok) {
        throw new Error('Failed to fetch CV');
      }
      return response.json();
    },
  });

  const handleDownload = () => {
    if (cvData?.url) {
      window.open(cvData.url, '_blank');
    } else if (error) {
      message.error('Failed to load CV');
    } else {
      message.info('No CV available');
    }
  };

  return (
    <Button
      type="link"
      loading={isPending}
      onClick={handleDownload}
      icon={<DownloadOutlined />}
    />
  )
}

export default CandidatesTable;
