'use client';

import ProcessStepsTable from "@/app/components/tables/ProcessStepsTable";
import { CandidateView } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Flex, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'


export default function Page(): JSX.Element {
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
  })

  if (isLoading) {
    return <Typography.Text>Loading...</Typography.Text>
  }

  if (!candidate) {
    return <Typography.Text>Candidate not found</Typography.Text>
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

      <Flex vertical>
        <Typography.Title level={4}>
          Process Steps
        </Typography.Title>
        <ProcessStepsTable
          candidateId={canId}
        />
      </Flex>
    </Flex>
  )
}
