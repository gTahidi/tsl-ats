import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProcessSteps from '@/app/components/ProcessSteps';
import CVUpload from '@/app/components/CVUpload';
import { getDownloadUrl } from '@/lib/s3';
import { Layout, Card, Typography, Space, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

async function getCandidate(jobId: string, candidateId: string) {
  return prisma.candidate.findFirst({
    where: {
      id: candidateId,
      jobId,
    },
    include: {
      job: true,
      steps: {
        orderBy: {
          date: 'desc',
        },
      },
    },
  });
}

export default async function CandidateDetailPage({
  params,
}: {
  params: { id: string; candidateId: string };
}) {
  const candidate = await getCandidate(params.id, params.candidateId);
  if (!candidate) notFound();

  const cvUrl = candidate.cvUrl ? await getDownloadUrl(candidate.cvUrl) : null;

  return (
    <Layout>
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <Space direction="vertical" size="small">
            <Link href={`/jobs/${params.id}`} style={{ color: '#2A9D8F' }}>
              <Space>
                <ArrowLeftOutlined />
                <Text>Back to Job</Text>
              </Space>
            </Link>
            <Title level={2}>{candidate.name}</Title>
            <Text type="secondary" style={{ fontSize: '18px' }}>{candidate.job.title}</Text>
          </Space>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Candidate Information */}
            <Card title={<Title level={4}>Candidate Information</Title>}>
              <Descriptions layout="vertical" column={1}>
                <Descriptions.Item label="Email">
                  {candidate.email}
                </Descriptions.Item>

                {candidate.linkedinUrl && (
                  <Descriptions.Item label="LinkedIn">
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2A9D8F' }}
                    >
                      View Profile
                    </a>
                  </Descriptions.Item>
                )}

                {candidate.notes && (
                  <Descriptions.Item label="Notes">
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{candidate.notes}</Text>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="CV">
                  {cvUrl ? (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2A9D8F' }}
                    >
                      View CV
                    </a>
                  ) : (
                    <CVUpload candidateId={candidate.id} />
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Process Steps */}
            <Card>
              <ProcessSteps
                candidateId={candidate.id}
                jobId={params.id}
                steps={candidate?.steps || []}
              />
            </Card>
          </div>
        </Space>
      </Content>
    </Layout>
  );
}
