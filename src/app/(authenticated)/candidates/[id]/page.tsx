'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, Descriptions, Button, Space, message, Tag } from 'antd';
import { FileOutlined, LinkedinOutlined, EditOutlined } from '@ant-design/icons';
import RightSidePanel from '@/app/components/RightSidePanel';
import type { Job, Persona } from '@/types';

interface Candidate {
  id: string;
  linkedinUrl?: string;
  cvUrl?: string;
  notes?: string;
  persona: Persona;
  job: Job;
  createdAt: string;
  updatedAt: string;
}

interface SidePanelState {
  open: boolean;
  mode: 'edit';
  initialValues: Candidate | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanelState>({
    open: false,
    mode: 'edit',
    initialValues: null,
  });

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/candidates/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch candidate');
      const data = await response.json();
      setCandidate(data);
    } catch (error) {
      message.error('Failed to fetch candidate details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  if (loading || !candidate) return <div>Loading...</div>;

  return (
    <Card
      title={
        <Space>
          {candidate.persona.name}
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setSidePanel({ open: true, mode: 'edit', initialValues: candidate })}
          >
            Edit
          </Button>
        </Space>
      }
    >
      <Descriptions column={2}>
        <Descriptions.Item label="Email">{candidate.persona.email}</Descriptions.Item>
        <Descriptions.Item label="Job Position">
          <Tag color="blue">{candidate.job.title}</Tag>
        </Descriptions.Item>
        {candidate.linkedinUrl && (
          <Descriptions.Item label="LinkedIn">
            <Button type="link" icon={<LinkedinOutlined />} href={candidate.linkedinUrl} target="_blank">
              View Profile
            </Button>
          </Descriptions.Item>
        )}
        {candidate.cvUrl && (
          <Descriptions.Item label="CV">
            <Button type="link" icon={<FileOutlined />} href={candidate.cvUrl} target="_blank">
              View CV
            </Button>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Notes" span={2}>{candidate.notes || '-'}</Descriptions.Item>
      </Descriptions>
      <RightSidePanel
        open={sidePanel.open}
        onClose={() => setSidePanel(prev => ({ ...prev, open: false }))}
        entityType="candidate"
        mode={sidePanel.mode}
        initialValues={sidePanel.initialValues}
        onSubmit={fetchCandidate}
      />
    </Card>
  );
}
