'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Tabs, Space, Button, Typography, Statistic, Row, Col, Select, Modal, Form, InputNumber, Divider, message } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  StopOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import InterviewsTable from '@/app/components/tables/InterviewsTable';
import ScheduleInterviewModal from '@/app/components/interviews/ScheduleInterviewModal';
import { useQuery } from '@tanstack/react-query';
import type { InterviewView } from '@/types';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch all interviews for statistics
  const { data: allInterviews } = useQuery<InterviewView[]>({
    queryKey: ['interviews'],
    queryFn: async () => {
      const response = await fetch('/api/interviews');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  

  // Fetch jobs for selector
  const { data: jobs } = useQuery<any[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to load jobs');
      return res.json();
    },
  });

  // Fetch process groups and step templates
  const { data: groups } = useQuery<any[]>({
    queryKey: ['process-groups'],
    queryFn: async () => {
      const res = await fetch('/api/process-groups');
      if (!res.ok) throw new Error('Failed to load process groups');
      return res.json();
    },
  });

  const selectedJob = useMemo(() => jobs?.find(j => j.id === selectedJobId), [jobs, selectedJobId]);
  const selectedGroup = useMemo(() => groups?.find(g => g.id === selectedJob?.processGroupId), [groups, selectedJob]);
  const stepOptions = useMemo<{ label: string; value: string }[]>(
    () => (selectedGroup?.stepTemplates || []).map((s: any) => ({ label: `${s.order}. ${s.name}`, value: String(s.id) })),
    [selectedGroup]
  );

  // Current event type details for selected template
  const { data: calConfig, refetch: refetchCalConfig, isFetching: isLoadingConfig } = useQuery<{ templateId: string; calcomEventTypeId: number | null; eventType: any | null }>({
    queryKey: ['template-calcom', selectedTemplateId],
    queryFn: async () => {
      const res = await fetch(`/api/process-step-templates/${selectedTemplateId}/calcom`);
      if (!res.ok) throw new Error('Failed to load template calcom config');
      return res.json();
    },
    enabled: !!selectedTemplateId && isConfigOpen,
  });

  useEffect(() => {
    if (!isConfigOpen) return;
    if (calConfig?.calcomEventTypeId) {
      form.setFieldsValue({ calcomEventTypeId: calConfig.calcomEventTypeId });
    } else {
      form.resetFields();
    }
  }, [calConfig, isConfigOpen, form]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!allInterviews) return { scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 };
    
    return allInterviews.reduce((acc, interview) => {
      const status = interview.status || 'scheduled';
      acc[status === 'in_progress' ? 'inProgress' : status]++;
      return acc;
    }, { scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 });
  }, [allInterviews]);

  const tabItems = [
    {
      key: 'all',
      label: 'All Interviews',
      children: <InterviewsTable />,
    },
    {
      key: 'scheduled',
      label: `Scheduled (${stats.scheduled})`,
      children: <InterviewsTable status="scheduled" />,
    },
    {
      key: 'in_progress',
      label: `In Progress (${stats.inProgress})`,
      children: <InterviewsTable status="in_progress" />,
    },
    {
      key: 'completed',
      label: `Completed (${stats.completed})`,
      children: <InterviewsTable status="completed" />,
    },
    {
      key: 'cancelled',
      label: `Cancelled (${stats.cancelled})`,
      children: <InterviewsTable status="cancelled" />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <Title level={2} style={{ margin: 0 }}>
            Interview Management
          </Title>
          <Space>
            {/* Job & Stage selectors */}
            <Select
              placeholder="Select Job"
              value={selectedJobId}
              onChange={(v) => { setSelectedJobId(v); setSelectedTemplateId(undefined); }}
              style={{ minWidth: 220 }}
              options={(jobs || []).map((j) => ({ label: j.title, value: j.id }))}
              showSearch
              optionFilterProp="label"
            />
            <Select
              placeholder="Select Stage"
              value={selectedTemplateId}
              onChange={(v) => setSelectedTemplateId(v)}
              style={{ minWidth: 220 }}
              options={stepOptions}
              disabled={!selectedJobId}
              showSearch
              optionFilterProp="label"
            />
            <Button
              icon={<SettingOutlined />}
              disabled={!selectedTemplateId}
              onClick={() => {
                setIsConfigOpen(true);
              }}
            >
              Configure Event Type
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              disabled={!selectedJobId || !selectedTemplateId}
              onClick={() => setIsScheduleOpen(true)}
            >
              Schedule Interview
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                // Navigate to candidates page to qualify more candidates
                window.location.href = '/candidates';
              }}
            >
              Qualify Candidates
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Scheduled"
                value={stats.scheduled}
                prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Cancelled"
                value={stats.cancelled}
                prefix={<StopOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Interviews Table with Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* Configure Cal.com Event Type Modal */}
      <Modal
        title="Configure Cal.com Event Type"
        open={isConfigOpen}
        onCancel={() => setIsConfigOpen(false)}
        destroyOnClose
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const res = await fetch(`/api/process-step-templates/${selectedTemplateId}/calcom`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ calcomEventTypeId: values.calcomEventTypeId }),
            });
            const json = await res.json();
            if (!res.ok) {
              throw new Error(json?.error || 'Failed to save');
            }
            message.success('Event type saved');
            setIsConfigOpen(false);
            await refetchCalConfig();
          } catch (e: any) {
            message.error(e?.message || 'Failed to save');
          }
        }}
        okButtonProps={{ disabled: isLoadingConfig }}
      >
        <div>
          <div className="mb-3">
            <div className="text-sm text-gray-500">Job</div>
            <div className="font-medium">{selectedJob?.title || '-'}</div>
          </div>
          <div className="mb-3">
            <div className="text-sm text-gray-500">Stage</div>
            <div className="font-medium">{stepOptions.find((o: { label: string; value: string }) => o.value === selectedTemplateId)?.label || '-'}</div>
          </div>
          <Divider />
          <Form form={form} layout="vertical" initialValues={{ calcomEventTypeId: calConfig?.calcomEventTypeId }}>
            <Form.Item
              label="Cal.com Event Type ID"
              name="calcomEventTypeId"
              rules={[{ required: true, message: 'Please enter a Cal.com event type ID' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="e.g., 12345" />
            </Form.Item>
          </Form>
          {calConfig?.eventType && (
            <div className="mt-2 text-sm text-gray-600">
              <div><strong>Resolved:</strong> {calConfig.eventType?.title || calConfig.eventType?.name || 'Event Type'}</div>
              {calConfig.eventType?.slug && <div><strong>Slug:</strong> {calConfig.eventType.slug}</div>}
            </div>
          )}
        </div>
      </Modal>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        open={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        jobId={selectedJobId}
        templateId={selectedTemplateId}
      />
    </div>
  );
}
