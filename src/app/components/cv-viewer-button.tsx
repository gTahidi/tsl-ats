'use client';

import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import CvViewer from './cv-viewer';

interface CvData {
  url: string;
  filename: string;
}

interface CvViewerButtonProps {
  apiEndpoint: string;
  tooltipText?: string;
  buttonText?: string;
  iconOnly?: boolean;
  buttonType?: 'link' | 'text' | 'default' | 'primary' | 'dashed';
}

/**
 * Reusable CV Viewer Button that can be used across the application
 * @param apiEndpoint - The API endpoint to fetch CV data (must return { url, filename })
 * @param tooltipText - Text to show in tooltip (default: "View CV")
 * @param buttonText - Text to show on button (default: "View CV")
 * @param iconOnly - Whether to show only icon without text
 * @param buttonType - Type of button (default: "link")
 */
const CvViewerButton: React.FC<CvViewerButtonProps> = ({
  apiEndpoint,
  tooltipText = "View CV",
  buttonText = "View CV",
  iconOnly = false,
  buttonType = "link"
}) => {
  const [loading, setLoading] = useState(false);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleViewCv = async () => {
    if (cvData) {
      // If we've already fetched the data, just show the modal
      setPreviewVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch CV data');
      }
      
      const data = await response.json();
      
      if (!data.url) {
        message.info('No CV file available');
        return;
      }
      
      setCvData({
        url: data.url,
        filename: data.filename || 'CV Document'
      });
      
      setPreviewVisible(true);
    } catch (error) {
      message.error('Error loading CV file');
      console.error('Error fetching CV:', error);
    } finally {
      setLoading(false);
    }
  };

  const buttonContent = iconOnly ? null : buttonText;

  return (
    <>
      <Tooltip title={tooltipText}>
        <Button 
          type={buttonType}
          onClick={handleViewCv}
          icon={loading ? <LoadingOutlined /> : <FileTextOutlined />}
          disabled={loading}
        >
          {buttonContent}
        </Button>
      </Tooltip>

      {cvData && (
        <CvViewer 
          visible={previewVisible}
          title={cvData.filename}
          fileUrl={cvData.url}
          onClose={() => setPreviewVisible(false)}
        />
      )}
    </>
  );
};

export default CvViewerButton;
