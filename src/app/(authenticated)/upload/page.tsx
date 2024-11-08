'use client';

import { useState } from 'react';
import { Card, Typography, Space, List, Tag } from 'antd';
import CVUpload from '@/app/components/CVUpload';

const { Title, Text, Paragraph } = Typography;

interface UploadRecord {
  id: string;
  url: string;
  timestamp: string;
}

export default function TestUpload() {
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);

  const handleUploadComplete = (fileUrl: string) => {
    setUploadHistory(prev => [
      {
        id: Math.random().toString(36).substring(7),
        url: fileUrl,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>File Upload Test Page</Title>

        <Card>
          <Paragraph>
            This page is for testing the CV upload functionality. Try uploading different file types
            (PDF, DOC, DOCX) to verify the component works correctly.
          </Paragraph>
          <Text strong>
            Total successful uploads: {uploadHistory.length}
          </Text>
        </Card>

        <CVUpload
          candidateId="test-candidate-id"
          onUploadComplete={handleUploadComplete}
        />

        {uploadHistory.length > 0 && (
          <Card title="Upload History">
            <List
              dataSource={uploadHistory}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Tag color="green">Success</Tag>
                      <Text>{item.timestamp}</Text>
                    </Space>
                    <Text copyable type="secondary" style={{ wordBreak: 'break-all' }}>
                      {item.url}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </div>
  );
}
