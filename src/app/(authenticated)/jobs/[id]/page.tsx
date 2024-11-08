'use client';

import { useEffect, useState } from 'react';
import { Spin, Card, Typography, Descriptions, Tabs, Button } from 'antd';
import { EditOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import CandidatesTable from '@/app/components/tables/CandidatesTable';
import { Job, Candidate, ProcessStep, CandidateView, JobView } from '@/types';
import RightSidePanel from '@/app/components/RightSidePanel';
import JobForm from '@/app/components/forms/JobForm';
import ProcessSteps from '@/app/components/ProcessSteps';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function JobDetails({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job & { candidateCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPanelOpen, setEditPanelOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const handleEditJob = async (updatedJob: Partial<Job>) => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJob),
      });

      if (!response.ok) throw new Error('Failed to update job');
      const data = await response.json();
      setJob(data);
      setEditPanelOpen(false);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <Title level={4}>Job not found</Title>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title={
          <div className="flex justify-between items-center">
            <Title level={3}>{job.title}</Title>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditPanelOpen(true)}
            >
              Edit Job
            </Button>
          </div>
        }
      >
        <Descriptions bordered>
          <Descriptions.Item label="Status">{job.status}</Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(job.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {new Date(job.updatedAt).toLocaleDateString()}
          </Descriptions.Item>
          {job.linkedinUrl && (
            <Descriptions.Item label="LinkedIn URL">
              <a href={job.linkedinUrl} target="_blank" rel="noopener noreferrer">
                {job.linkedinUrl}
              </a>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Description" span={3}>
            {job.description}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="candidates">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Candidates
            </span>
          }
          key="candidates"
        >
          <CandidatesTable
            candidates={(job.candidates ?? []).map(candidate => ({
              id: candidate.id,
              name: candidate.persona.name,
              email: candidate.persona.email,
              status: candidate.currentStep?.name || 'Not Started',
              jobTitle: job.title,
              createdAt: candidate.createdAt,
              updatedAt: candidate.updatedAt,
              linkedinUrl: candidate.linkedinUrl || null,
              cvUrl: candidate.cvUrl || null,
              notes: candidate.notes || null,
              personaId: candidate.personaId,
              jobId: candidate.jobId,
              steps: candidate.steps || [],
              currentStep: candidate.currentStep || null,
              persona: candidate.persona
            } as CandidateView))}
            onEdit={() => {}}
            onDelete={() => {}}
            jobId={params.id}
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              Process Steps
            </span>
          }
          key="process"
        >
          {(job.candidates ?? []).map((candidate) => (
            <div key={candidate.id} className="mb-4">
              <Card title={`Process Steps for ${candidate.persona.name}`}>
                <ProcessSteps
                  candidateId={candidate.id}
                  steps={candidate.steps || []}
                />
              </Card>
            </div>
          ))}
        </TabPane>
      </Tabs>

      <RightSidePanel
        open={editPanelOpen}
        onClose={() => setEditPanelOpen(false)}
        entityType="job"
        mode="edit"
        initialValues={job}
        onSubmit={handleEditJob}
      />
    </div>
  );
}
