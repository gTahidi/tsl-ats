'use client';

import { useState } from 'react';
import { Typography, Card, Space, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title } = Typography;
const { Dragger } = Upload;

export default function UploadPage() {
  const [loading, setLoading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    action: '/api/upload',
    accept: '.pdf,.doc,.docx',
    onChange(info) {
      const { status } = info.file;
      if (status === 'uploading') {
        setLoading(true);
      }
      if (status === 'done') {
        setLoading(false);
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        setLoading(false);
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={2}>Upload CV</Title>
      </Card>
      <Card>
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag CV file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for PDF, DOC, DOCX files. Single file upload only.
          </p>
        </Dragger>
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            Maximum file size: 10MB. Please ensure the CV is in a readable format.
          </Typography.Text>
        </div>
      </Card>
    </Space>
  );
}
