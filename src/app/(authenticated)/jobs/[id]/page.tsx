'use client';

import CandidatesTable from "@/app/components/tables/CandidatesTable";
import { JobView } from "@/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Flex, Typography } from "antd";
import { useParams, useRouter } from 'next/navigation'


export default function Page(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const jobId = params.id;

  const {
    data: job,
    isLoading,
  } = useQuery<JobView>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      return response.json();
    },
  })

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
      <Flex vertical>
        <Typography.Title level={4}>
          Candidates
        </Typography.Title>
        <CandidatesTable
          jobId={jobId}
        />
      </Flex>
    </Flex >
  )
}
