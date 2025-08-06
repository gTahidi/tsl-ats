'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Descriptions, 
  Alert,
  Modal,
  Form,
  Input,
  message,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined,
  VideoCameraOutlined, 
  CalendarOutlined, 
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InterviewView } from '@/types';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const interviewId = params.id as string;
  
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data: interview, isLoading, error } = useQuery<InterviewView>({
    queryKey: ['interview', interviewId],
    queryFn: async () => {
      const response = await fetch(`/api/interviews/${interviewId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch interview details');
      }
      return response.json();
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
      message.success('Notes updated successfully');
      setIsNotesModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to update notes');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'blue';
      case 'in_progress':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarOutlined />;
      case 'in_progress':
        return <ClockCircleOutlined />;
      case 'completed':
        return <VideoCameraOutlined />;
      case 'cancelled':
        return <ClockCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  const handleJoinMeeting = () => {
    if (interview?.meetingUrl) {
      window.open(interview.meetingUrl, '_blank');
    } else {
      message.warning('Meeting URL not available');
    }
  };

  const handleAddNotes = () => {
    form.setFieldsValue({ notes: interview?.notes || '' });
    setIsNotesModalVisible(true);
  };

  const handleNotesSubmit = (values: { notes: string }) => {
    updateNotesMutation.mutate(values.notes);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description="Failed to load interview details. Please try again."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isUpcoming = interview.status === 'scheduled';
  const isOngoing = interview.status === 'in_progress';
  const canJoinMeeting = (isUpcoming || isOngoing) && interview.meetingUrl;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Space className="mb-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
          >
            Back
          </Button>
        </Space>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Interview Details
            </Title>
            <Paragraph className="text-gray-600 mt-2">
              {interview.candidate?.persona?.name} {interview.candidate?.persona?.surname} - {interview.candidate?.job?.title}
            </Paragraph>
          </div>
          
          <Space>
            {canJoinMeeting && (
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={handleJoinMeeting}
                size="large"
              >
                Join Meeting
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={handleAddNotes}
            >
              {interview.notes ? 'Edit Notes' : 'Add Notes'}
            </Button>
            <Button
              icon={<UserOutlined />}
              onClick={() => router.push(`/candidates/${interview.candidate?.id}`)}
            >
              View Candidate
            </Button>
          </Space>
        </div>
      </div>

      {/* Status Alert */}
      {isOngoing && (
        <Alert
          message="Interview In Progress"
          description="This interview is currently ongoing. You can join the meeting using the button above."
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interview Information */}
        <div className="lg:col-span-2">
          <Card title="Interview Information" className="mb-6">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Status" span={2}>
                <Tag 
                  color={getStatusColor(interview.status || 'scheduled')} 
                  icon={getStatusIcon(interview.status || 'scheduled')}
                >
                  {(interview.status || 'scheduled').replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {new Date(interview.startTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {new Date(interview.endTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {Math.round((new Date(interview.endTime).getTime() - new Date(interview.startTime).getTime()) / (1000 * 60))} minutes
              </Descriptions.Item>
              <Descriptions.Item label="Interview Room">
                {interview.room?.name} ({interview.room?.location})
              </Descriptions.Item>
              {interview.calComBookingId && (
                <Descriptions.Item label="Booking ID" span={2}>
                  {interview.calComBookingId}
                </Descriptions.Item>
              )}
              {interview.meetingUrl && (
                <Descriptions.Item label="Meeting URL" span={2}>
                  <a 
                    href={interview.meetingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {interview.meetingUrl}
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Notes Section */}
          <Card 
            title="Interview Notes" 
            extra={
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={handleAddNotes}
              >
                {interview.notes ? 'Edit' : 'Add Notes'}
              </Button>
            }
          >
            {interview.notes ? (
              <Paragraph>{interview.notes}</Paragraph>
            ) : (
              <Paragraph className="text-gray-500 italic">
                No notes added yet. Click "Add Notes" to add interview notes.
              </Paragraph>
            )}
          </Card>
        </div>

        {/* Candidate Information */}
        <div>
          <Card title="Candidate Information">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {interview.candidate?.persona?.name} {interview.candidate?.persona?.surname}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {interview.candidate?.persona?.email}
              </Descriptions.Item>
              {interview.candidate?.persona?.phone && (
                <Descriptions.Item label="Phone">
                  {interview.candidate?.persona?.phone}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Job Position">
                {interview.candidate?.job?.title}
              </Descriptions.Item>
              {interview.candidate?.rating && (
                <Descriptions.Item label="Rating">
                  {interview.candidate.rating.matchScore}/100
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <div className="mt-4">
              <Button 
                type="link" 
                icon={<UserOutlined />}
                onClick={() => router.push(`/candidates/${interview.candidate?.id}`)}
                className="p-0"
              >
                View Full Candidate Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notes Modal */}
      <Modal
        title="Interview Notes"
        open={isNotesModalVisible}
        onCancel={() => setIsNotesModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleNotesSubmit}
          layout="vertical"
        >
          <Form.Item
            name="notes"
            label="Notes"
            rules={[{ required: true, message: 'Please enter some notes' }]}
          >
            <TextArea
              rows={6}
              placeholder="Enter interview notes, observations, or feedback..."
            />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsNotesModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateNotesMutation.isPending}
              >
                Save Notes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
