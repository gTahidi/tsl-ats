'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import { FilePdfOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';

interface CvViewerProps {
  visible: boolean;
  title: string;
  fileUrl: string | null;
  onClose: () => void;
}

const CvViewer: React.FC<CvViewerProps> = ({ visible, title, fileUrl, onClose }) => {
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <Modal
      title={(
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isPdf ? <FilePdfOutlined style={{ marginRight: 8 }} /> : <FileTextOutlined style={{ marginRight: 8 }} />}
          {title}
        </div>
      )}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} href={fileUrl || '#'} target="_blank" disabled={!fileUrl}>
          Download
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>
      ]}
      width="80%"
      style={{ top: 20 }}
    >
      {fileUrl ? (
        <div style={{ height: '80vh', width: '100%' }}>
          {isPdf ? (
            <iframe 
              src={`${fileUrl}#toolbar=1&navpanes=1`} 
              width="100%" 
              height="100%" 
              style={{ border: 'none' }} 
              title="PDF Viewer"
            />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>This file type cannot be previewed directly.</p>
              <Button type="primary" href={fileUrl} target="_blank">
                Download File
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No CV file available.</p>
        </div>
      )}
    </Modal>
  );
};

export default CvViewer;
