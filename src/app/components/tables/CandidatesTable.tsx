'use client';

import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { CandidateView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RatingModal from '../RatingModal';
import CvViewerButton from '../cv-viewer-button';

const { Title } = Typography;

interface CandidatesTableProps {
  jobId?: string;
  onEdit?: (candidate: CandidateView) => void;
  onDelete?: (candidate: CandidateView) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ jobId, onEdit, onDelete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: fetchedCandidates, isLoading } = useQuery<CandidateView[]>({
    queryKey: ['candidates', jobId],
    queryFn: async () => {
      const url = jobId ? `/api/jobs/${jobId}/candidates` : '/api/candidates';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
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
      render: (record) => `${record.persona?.name || ''} ${record.persona?.surname || ''}`.trim(),
      sorter: (a, b) => {
        // Compare first by name, then by surname
        const nameA = `${a.persona?.name} ${a.persona?.surname}`.trim();
        const nameB = `${b.persona?.name} ${b.persona?.surname}`.trim();
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Email',
      key: 'email',
      render: (record) => record.persona?.email,
      ellipsis: true,
    },
    ...(!jobId ?
      [
        {
          title: 'Job',
          key: 'jobTitle',
          render: (record: CandidateView) => record.job?.title,
        },
      ] : []
    ),
    {
      title: 'CV',
      key: 'cvUrl',
      render: (record: CandidateView) => {
        // Always show the CV button - the API endpoint will handle cases where CV isn't available
        return <CVButton id={record.id} />
      }
    },
    {
      title: 'Step',
      key: 'step',
      sorter: (a, b) => {
        const stepA = a.steps?.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        const stepB = b.steps?.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        return (stepA?.template?.order || 0) - (stepB?.template?.order || 0);
      },
      render: (record: CandidateView) => {
        const currentStep = record.steps?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!currentStep) {
          return '-';
        }

        return (
          <span>
            {currentStep.template.order} - {currentStep.template.name}
          </span>
        );
      }
    },
    {
      title: 'Rating',
      key: 'rating',
      sorter: (a, b) => (a.rating?.matchScore || 0) - (b.rating?.matchScore || 0),
      filters: [
        { text: 'Rated', value: true },
        { text: 'Not Rated', value: false },
      ],
      onFilter: (value, record) => {
        if (value === true) {
          return !!record.rating;
        }
        return !record.rating;
      },
      render: (record: CandidateView) => {
        // Use RatingModal instead of RatingTag to allow users to click and see details
        // Pass the entire rating object directly to avoid additional API calls
        return (
          <RatingModal 
            candidateId={record.id} 
            initialRating={record.rating?.matchScore || null}
            ratingObject={record.rating || null}
          />
        );
      },
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
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Candidates ({fetchedCandidates?.length || 0})
      </Title>
      <Table
        dataSource={fetchedCandidates || []}
        columns={columns}
        rowKey="id"
        loading={isLoading || deleteCandidateMutation.isPending}
        pagination={{
          defaultPageSize: 25,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} candidates`,
        }}
      />
    </div>
  );
};

const CVButton = ({ id }: { id: string }) => {
  return (
    <CvViewerButton
      apiEndpoint={`/api/candidates/${id}/cv-azure`}
      buttonText="View"
      tooltipText="View CV"
    />
  );
}

export default CandidatesTable;
