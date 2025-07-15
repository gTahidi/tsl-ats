import { useState } from 'react';
import { Flex, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface CVUploadProps {
  candidateId?: string;
  onUploadComplete: (_: string) => void;
}

export default function CVUpload({ candidateId, onUploadComplete }: CVUploadProps) {
  const [uploading, setUploading] = useState(false);

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.doc,.docx',
    maxCount: 1,
    beforeUpload: (file) => {
      // Validate file size (10MB limit)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        if (candidateId) {
          formData.append('candidateId', candidateId);
        }

        const response = await fetch('/api/upload-blob', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        onSuccess?.(data);
        onUploadComplete(data.key);
        message.success('CV uploaded successfully');
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'File upload failed';
        onError?.(error as Error);
        message.error(errorMessage);
      } finally {
        setUploading(false);
      }
    },
    onDrop(e) {
      // Handle dropped files
      console.log('Dropped files', e.dataTransfer.files);
    },
    onRemove: () => {
      // Handle file removal
      onUploadComplete('');
      return true;
    },
  };

  return (
    <Flex>
      <Dragger {...props} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag CV file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for PDF, DOC, DOCX. Single file upload only.
        </p>
      </Dragger>
    </Flex>
  );
}
