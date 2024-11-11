'use client';

import CandidateModal from "@/app/components/CandidateModal";
import CandidatesTable from "@/app/components/tables/CandidatesTable";
import { CandidateView, JobView } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Flex, message, Splitter, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'
import { useState } from "react";


export default function Page(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateView | null>(null);

  const jobId = params.id;

  const {
    data: job,
    isLoading,
  } = useQuery<JobView>({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      return response.json();
    },
  })

  const handleEdit = (candidate: CandidateView) => {
    setEditingCandidate(candidate);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingCandidate(null);
  };

  const handleCreateOrUpdate = async (values: Partial<CandidateView>) => {
    if (!editingCandidate || !job) {
      return;
    }

    try {
      const url = `/api/candidates/${editingCandidate.id}`;

      const now = new Date();
      values.updatedAt = now;

      const data = {
        ...values,
        job: {
          connect: {
            id: values.jobId,
          },
        },
        persona: {
          connect: {
            id: values.personaId,
          },
        },
        personaId: undefined,
        jobId: undefined,
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save candidate');

      qc.invalidateQueries({ queryKey: ['candidates'] });
      message.success(`Candidate ${editingCandidate ? 'updated' : 'created'} successfully`);

      setModalVisible(false);
      setEditingCandidate(null);
    } catch (error) {
      message.error('Failed to save candidate');
    }
  };

  if (isLoading) {
    return <Typography.Text>Loading...</Typography.Text>
  }

  if (!job) {
    return <Typography.Text>Job not found</Typography.Text>
  }

  return (
    <Flex gap="middle" vertical>
      <Flex
        justify="flex-start"
        gap={10}
      >
        <Button
          type="dashed"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography.Title level={3}>
          {job.title}
        </Typography.Title>
      </Flex>
      <Splitter>
        <Splitter.Panel defaultSize="60%" min="40%" max="80%" style={{ paddingRight: 10 }}>
          <Flex vertical>
            <Typography.Title level={5}>
              Candidates
            </Typography.Title>
            <CandidatesTable
              jobId={job.id}
              onEdit={handleEdit}
            />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel style={{ paddingLeft: 10 }}>
          <Flex gap={20} vertical>
            <Flex gap={1} vertical align="flex-start">
              <Typography.Title level={5}>
                LinkedIn URL
              </Typography.Title>
              {!!job.linkedinUrl ? (
                <Typography.Link href={job.linkedinUrl} target="_blank" copyable>
                  {job.linkedinUrl}
                </Typography.Link>
              ) : (
                <Typography.Text>
                  Not provided
                </Typography.Text>
              )}
            </Flex>
            <Flex gap={1} vertical align="flex-start">
              <Typography.Title level={5}>
                Description
              </Typography.Title>
              {!job.description && <Typography.Text>Not provided</Typography.Text>}
              <Flex gap={4} vertical align="flex-start">
                {job.description && (
                  job.description.split('\n').map((line, index) => (
                    <Typography.Text key={index}>
                      {line}
                    </Typography.Text>
                  )
                  ))}
              </Flex>
            </Flex>
          </Flex>
        </Splitter.Panel>
      </Splitter>

      <CandidateModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleCreateOrUpdate}
        candidate={editingCandidate}
      />
    </Flex >
  )
}
