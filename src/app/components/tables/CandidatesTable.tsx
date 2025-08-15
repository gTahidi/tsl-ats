'use client';

import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, CheckOutlined, CalendarOutlined } from '@ant-design/icons';
import type { CandidateView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RatingModal from '../RatingModal';
import CvViewerButton from '../cv-viewer-button';
import JobSelector from '../JobSelector';
import Link from 'next/link';

const { Title } = Typography;

interface CandidatesTableProps {
  jobId?: string;
  onQualify?: (candidate: CandidateView) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ jobId, onQualify }) => {
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

  const qualifyCandidateMutation = useMutation({
    mutationFn: async ({ candidateId, qualified }: { candidateId: string, qualified: boolean }) => {
      const response = await fetch(`/api/candidates/${candidateId}/qualify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qualified }),
      });
      if (!response.ok) {
        throw new Error('Failed to update qualification status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      message.success('Candidate qualification status updated');
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to update qualification status');
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
          width: 280, // Set fixed width to prevent overlapping
          render: (record: CandidateView) => {
            if (!record.job) return '-';
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <JobSelector
                  candidateId={record.id}
                  currentJobId={record.job.id}
                  currentJobTitle={record.job.title}
                  onSuccess={() => {
                    // Table will auto-refresh due to query invalidation in JobSelector
                  }}
                />
              </div>
            );
          },
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
      title: 'Rating',
      key: 'rating',
      sorter: (a, b) => (a.rating?.matchScore || 0) - (b.rating?.matchScore || 0),
      filters: [
        { text: 'Rated', value: 'true' },
        { text: 'Not Rated', value: 'false' },
      ],
      onFilter: (value, record) => {
        if (value === 'true') {
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
          <Tooltip title="View candidate details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleRowClick(record)}
            />
          </Tooltip>
          {!record.qualified ? (
            <Tooltip title="Qualify for interview">
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  qualifyCandidateMutation.mutate({
                    candidateId: record.id,
                    qualified: true,
                  });
                }}
                loading={
                  qualifyCandidateMutation.isPending &&
                  qualifyCandidateMutation.variables?.candidateId === record.id
                }
              />
            </Tooltip>
          ) : (
            <Tooltip title="View Interview">
              <Link href={`/interviews?candidateId=${record.id}`} passHref>
                <Button
                  type="text"
                  icon={<CalendarOutlined style={{ color: '#52c41a' }} />}
                />
              </Link>
            </Tooltip>
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
