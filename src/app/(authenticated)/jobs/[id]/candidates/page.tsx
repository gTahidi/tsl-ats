'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, Button, message, Card, Typography } from 'antd';
import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';

interface Candidate {
    id: string
    linkedinUrl: string | null
    cvUrl: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    personaId: string
    jobId: string
    persona: {
        id: string
        name: string
        email: string
        notes: string | null
        createdAt: Date
        updatedAt: Date
    },
    steps: {
        id: string
        type: string
        status: string
        notes: string | null
        date: Date
        createdAt: Date
        updatedAt: Date
        candidateId: string
    }[]
}

export default function JobCandidatesPage({
    params,
}: {
    params: { id: string };
}) {
    const [cands, setCands] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCands = useCallback(async () => {
        try {
            const response = await fetch(`/api/candidates?jobId=${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch candidates for job');
            }
            const data = await response.json();
            setCands(data);
        } catch (error) {
            console.error('Error:', error);
            message.error('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchCands();
    }, [fetchCands]);

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (c: Candidate) => c.persona.name,
        },
        {
            title: 'Email',
            key: 'email',
            render: (c: Candidate) => c.persona.email,
        },
        {
            title: 'LinkedIn',
            dataIndex: 'linkedinUrl',
            key: 'linkedinUrl',
        },
        {
            title: 'CV',
            dataIndex: 'cvUrl',
            key: 'cvUrl',
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
        },
        {
            title: 'Step',
            dataIndex: 'steps',
            key: 'step',
            render: (steps: any[]) => steps.length > 0 ? steps[0].type : null,
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
        },
        {
            title: 'Updated At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Candidate) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/jobs/${record.id}/candidates/${record.id}`}>Edit</Link>
                </div>
            ),
        },
    ];

    return (
        <Card>
            <Typography.Title>
                Job Candidates
            </Typography.Title>
            <Link href={`/jobs/${params.id}/candidates/new`}>
                <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: '1rem' }}>
                    New Candidate
                </Button>
            </Link>
            <Table
                columns={columns}
                dataSource={cands}
                rowKey="id"
                loading={loading}
            />
        </Card>
    );
}
