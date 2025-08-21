'use client';

import { CandidateView } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Flex, Spin, Table, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'
import RatingTag from "@/app/components/RatingTag";
import CandidateNotes from "@/app/components/CandidateNotes";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const canId = params.id;

  const {
    data: candidate,
    isLoading,
  } = useQuery<CandidateView>({
    queryKey: ['candidates', canId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${canId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch candidate');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }} vertical flex={1}>
        <Spin />
      </Flex>
    )
  }

  if (!candidate) {
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }} vertical flex={1}>
        <Alert
          message="Candidate not found"
          type="error"
          closable={false}
        />
      </Flex>
    )
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
          {candidate.persona.name} - {candidate.job.title}
        </Typography.Title>
      </Flex>
      <Flex vertical gap="middle">
        <Flex vertical>
          <Typography.Title level={4}>
            Information
          </Typography.Title>
          <Table
            dataSource={[candidate]}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Name',
                key: 'name',
                render: (record: CandidateView) => `${record.persona.name} ${record.persona.surname}`,
              },
              {
                title: 'Email',
                key: 'email',
                render: (record: CandidateView) => (
                  <Typography.Link href={`mailto:${record.persona.email}`} copyable>
                    {record.persona.email}
                  </Typography.Link>
                ),
                ellipsis: true,
              },
              {
                title: 'Phone',
                key: 'phone',
                render: (record: CandidateView) => record.persona.phone ? (
                  <Typography.Link copyable={{ text: record.persona.phone }}>
                    {record.persona.phone}
                  </Typography.Link>
                ) : '-',
              },
              {
                title: 'Location',
                key: 'location',
                render: (record: CandidateView) => record.persona.location || '-',
              },
              {
                title: 'Final Rating',
                key: 'rating',
                render: (record: CandidateView) => {
                  return <RatingTag rating={candidate.rating?.matchScore} />;
                },
              },
            ]}
          />
        </Flex>
        <CandidateNotes candidateId={canId} />
      </Flex>
    </Flex>
  )
}
