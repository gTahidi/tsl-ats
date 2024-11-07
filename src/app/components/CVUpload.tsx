'use client';

import { useState } from 'react';
import { message } from 'antd';
import Alert from 'antd/es/alert';
import Dragger from 'antd/es/upload/Dragger';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

type CVUploadProps = {
  candidateId: string;
  onUploadComplete?: (fileUrl: string) => void;
};

export default function CVUpload({ candidateId, onUploadComplete }: CVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file: RcFile): Promise<boolean> => {
    setUploading(true);
    setError('');

    try {
      const response = await fetch('/api/mock-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.success) {
        message.success('File uploaded successfully');
        onUploadComplete?.(data.fileUrl);
        return true;
      }

      throw new Error(data.error || 'Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
      message.error('Failed to upload file');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.doc,.docx',
    customRequest: async (options: any) => {
      try {
        const success = await handleUpload(options.file as RcFile);
        if (success) {
          options.onSuccess?.(null);
        } else {
          options.onError?.(new Error('Upload failed'));
        }
      } catch (err) {
        options.onError?.(err as Error);
      }
    },
    onChange(info: UploadChangeParam<UploadFile>) {
      if (info.file.status === 'done') {
        setError('');
      }
    },
  };

  return (
    <div>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '1rem' }}
        />
      )}
      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag CV file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Support for PDF, DOC, DOCX files.
        </p>
      </Dragger>
    </div>
  );
}
