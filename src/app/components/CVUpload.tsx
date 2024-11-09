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
          throw new Error('Upload failed');
        }

        const data = await response.json();
        onSuccess?.(data);
        onUploadComplete(data.key);
        message.success('File uploaded successfully.');
      } catch (error) {
        onError?.(error as Error);
        message.error('File upload failed.');
      } finally {
        setUploading(false);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
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
