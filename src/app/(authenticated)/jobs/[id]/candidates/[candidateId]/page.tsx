import { prisma } from '@/utils/db/prisma';
import { Card, Typography, Descriptions, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ProcessSteps from '@/app/components/ProcessSteps';
import Link from 'next/link';

const { Title } = Typography;

export default async function CandidatePage({
  params,
}: {
  params: { id: string; candidateId: string };
}) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    include: {
      persona: true,
      job: true,
      steps: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Candidate Details</Title>
        <Link href={`/jobs/${params.id}/candidates`}>
          <Button>Back to Candidates</Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Personal Information">
          <Descriptions column={1}>
            <Descriptions.Item label="Name">{candidate.persona.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{candidate.persona.email}</Descriptions.Item>
            {candidate.persona.notes && (
              <Descriptions.Item label="Notes">{candidate.persona.notes}</Descriptions.Item>
            )}
            {candidate.linkedinUrl && (
              <Descriptions.Item label="LinkedIn">
                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  Profile
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Job Information">
          <Descriptions column={1}>
            <Descriptions.Item label="Position">{candidate.job.title}</Descriptions.Item>
            {candidate.job.description && (
              <Descriptions.Item label="Job Description">
                {candidate.job.description}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">{candidate.job.status}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Documents">
          <Upload
            action={`/api/candidates/${candidate.id}/cv`}
            showUploadList={true}
            maxCount={1}
            accept=".pdf,.doc,.docx"
            onChange={(info) => {
              if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
              } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>Upload CV</Button>
          </Upload>
          {candidate.cvUrl && (
            <div style={{ marginTop: '16px' }}>
              <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer">
                View Current CV
              </a>
            </div>
          )}
        </Card>

        <Card title="Process">
          <div style={{ marginTop: '16px' }}>
            <ProcessSteps
              candidateId={candidate.id}
              steps={candidate?.steps || []}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
