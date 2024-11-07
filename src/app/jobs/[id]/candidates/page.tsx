import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Layout, Typography, Space, Table } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Text } = Typography;

async function getCandidates(jobId: string) {
    return prisma.candidate.findMany({
        where: {
            jobId,
        },
        include: {
            job: true,
            persona: true,
            steps: {
                orderBy: {
                    date: 'desc',
                },
            },
        },
    });
}

export default async function CandidatesPage({
    params,
}: {
    params: { id: string; };
}) {
    const candidates = await getCandidates(params.id);

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
                    </Space>

                    <Table
                        dataSource={candidates}
                        columns={[
                            {
                                title: 'Name',
                                dataIndex: 'persona.name',
                                key: 'name',
                                render: (name: string, record: any) => (
                                    <Link href={`/jobs/${params.id}/candidates/${record.id}`}>{name}</Link>
                                ),
                            },
                            {
                                title: 'Email',
                                dataIndex: 'persona.email',
                                key: 'email',
                            },
                            {
                                title: 'Notes',
                                dataIndex: 'persona.notes',
                                key: 'notes',
                                ellipsis: true,
                            },
                            {
                                title: 'Created',
                                dataIndex: 'persona.createdAt',
                                key: 'createdAt',
                                render: (date: string) => new Date(date).toLocaleDateString(),
                                sorter: (a: any, b: any) => new Date(a.persona.createdAt).getTime() - new Date(b.persona.createdAt).getTime(),
                            },
                        ]}
                    />
                </Space>
            </Content>
        </Layout>
    );
}
