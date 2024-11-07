'use client';

import { useState } from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface CVUploadProps {
  onUploadComplete: (url: string) => void;
  defaultFileUrl?: string;
}

export default function CVUpload({ onUploadComplete, defaultFileUrl }: CVUploadProps) {
  const [uploading, setUploading] = useState(false);

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    action: '/api/upload',
    accept: '.pdf,.doc,.docx',
    onChange(info) {
      const { status } = info.file;

      if (status === 'uploading') {
        setUploading(true);
      }

      if (status === 'done') {
        setUploading(false);
        message.success(`${info.file.name} file uploaded successfully.`);
        onUploadComplete(info.file.response.url);
      } else if (status === 'error') {
        setUploading(false);
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <div>
      <Dragger {...props} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag CV file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for PDF, DOC, DOCX. Single file upload only.
        </p>
      </Dragger>
      {defaultFileUrl && (
        <div style={{ marginTop: 16 }}>
          <a href={defaultFileUrl} target="_blank" rel="noopener noreferrer">
            View Current CV
          </a>
        </div>
      )}
    </div>
  );
}
