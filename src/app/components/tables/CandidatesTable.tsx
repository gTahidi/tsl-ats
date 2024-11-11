'use client';

import React from 'react';
import { Table, Button, Popconfirm, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
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
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
    />
  );
};

const CVButton = ({ id }: { id: string }) => {
  const {
    mutateAsync: fetchCV,
    isPending,
  } = useMutation<{ url: string | null }>({
    mutationFn: async () => {
      const response = await fetch(`/api/candidates/${id}/cv-blob`);
      if (!response.ok) {
        throw new Error('Failed to fetch CV');
      }
      return response.json();
    },
  });

  return (
    <Button
      type="dashed"
      disabled={isPending}
      loading={isPending}
      onClick={async () => {
        const { url } = await fetchCV();

        if (url) {
          window.open(url, '_blank');
        } else {
          message.error('No CV found');
        }
      }}
    >
      Download CV
    </Button>
  )
}

export default CandidatesTable;
