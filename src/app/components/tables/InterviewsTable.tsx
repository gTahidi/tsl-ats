'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Tooltip, Typography, Space, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  EyeOutlined, 
  VideoCameraOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import type { InterviewView } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const { Title } = Typography;

interface InterviewsTableProps {
  candidateId?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

const InterviewsTable: React.FC<InterviewsTableProps> = ({ candidateId, status }) => {
  const router = useRouter();
  const [selectedInterview, setSelectedInterview] = useState<InterviewView | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: interviews, isLoading } = useQuery<InterviewView[]>({
    queryKey: ['interviews', candidateId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (candidateId) params.append('candidateId', candidateId);
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/interviews?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
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
        return <EyeOutlined />;
      case 'cancelled':
        return <ClockCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  const handleJoinMeeting = (interview: InterviewView) => {
    if (interview.meetingUrl) {
      window.open(interview.meetingUrl, '_blank');
    } else {
      message.warning('Meeting URL not available');
    }
  };

  const handleViewDetails = (interview: InterviewView) => {
    setSelectedInterview(interview);
    setIsModalVisible(true);
  };

  const columns: ColumnsType<InterviewView> = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (record) => (
        <div>
          <div className="font-medium">
            {record.candidate?.persona?.name} {record.candidate?.persona?.surname}
          </div>
          <div className="text-sm text-gray-500">
            {record.candidate?.persona?.email}
          </div>
        </div>
      ),
      sorter: (a, b) => {
        const nameA = `${a.candidate?.persona?.name} ${a.candidate?.persona?.surname}`;
        const nameB = `${b.candidate?.persona?.name} ${b.candidate?.persona?.surname}`;
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Job',
      key: 'job',
      render: (record) => record.candidate?.job?.title || '-',
      ellipsis: true,
    },
    {
      title: 'Interview Room',
      key: 'room',
      render: (record) => (
        <div>
          <div>{record.room?.name}</div>
          <div className="text-sm text-gray-500">{record.room?.location}</div>
        </div>
      ),
    },
    {
      title: 'Scheduled Time',
      key: 'scheduledTime',
      render: (record) => {
        const startTime = new Date(record.startTime);
        const endTime = new Date(record.endTime);
        return (
          <div>
            <div>{startTime.toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
      sorter: (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record) => (
        <Tag 
          color={getStatusColor(record.status || 'scheduled')} 
          icon={getStatusIcon(record.status || 'scheduled')}
        >
          {(record.status || 'scheduled').replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => (record.status || 'scheduled') === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.meetingUrl && (record.status === 'scheduled' || record.status === 'in_progress') && (
            <Tooltip title="Join Meeting">
              <Button
                type="text"
                icon={<VideoCameraOutlined />}
                onClick={() => handleJoinMeeting(record)}
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
          <Tooltip title="View Candidate">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => router.push(`/candidates/${record.candidate?.id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Interviews ({interviews?.length || 0})
      </Title>
      <Table
        dataSource={interviews || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          defaultPageSize: 25,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} interviews`,
        }}
      />

      {/* Interview Details Modal */}
      <Modal
        title="Interview Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          selectedInterview?.meetingUrl && (
            <Button
              key="join"
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => handleJoinMeeting(selectedInterview)}
            >
              Join Meeting
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedInterview && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Candidate Information</h4>
              <p><strong>Name:</strong> {selectedInterview.candidate?.persona?.name} {selectedInterview.candidate?.persona?.surname}</p>
              <p><strong>Email:</strong> {selectedInterview.candidate?.persona?.email}</p>
              <p><strong>Job:</strong> {selectedInterview.candidate?.job?.title}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Interview Details</h4>
              <p><strong>Room:</strong> {selectedInterview.room?.name} ({selectedInterview.room?.location})</p>
              <p><strong>Start Time:</strong> {new Date(selectedInterview.startTime).toLocaleString()}</p>
              <p><strong>End Time:</strong> {new Date(selectedInterview.endTime).toLocaleString()}</p>
              <p><strong>Status:</strong> 
                <Tag 
                  color={getStatusColor(selectedInterview.status || 'scheduled')} 
                  icon={getStatusIcon(selectedInterview.status || 'scheduled')}
                  style={{ marginLeft: 8 }}
                >
                  {(selectedInterview.status || 'scheduled').replace('_', ' ').toUpperCase()}
                </Tag>
              </p>
            </div>

            {selectedInterview.calComBookingId && (
              <div>
                <h4 className="font-medium text-gray-900">Booking Information</h4>
                <p><strong>Cal.com Booking ID:</strong> {selectedInterview.calComBookingId}</p>
                {selectedInterview.meetingUrl && (
                  <p><strong>Meeting URL:</strong> 
                    <a 
                      href={selectedInterview.meetingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {selectedInterview.meetingUrl}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewsTable;
