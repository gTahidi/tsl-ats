'use client';

import React, { useState } from 'react';
import { Button, Modal, List, Spin, message } from 'antd';
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import CvViewerButton from './cv-viewer-button';

interface PersonaCvsButtonProps {
  personaId: string;
  buttonText?: string;
}

/**
 * Button component that shows a list of CVs associated with a persona
 * A persona can have multiple CVs through its candidates
 */
const PersonaCvsButton: React.FC<PersonaCvsButtonProps> = ({ 
  personaId,
  buttonText = "View CVs"
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cvs, setCvs] = useState<Array<{ id: string, url: string, filename: string }>>([]);

  const handleViewCvs = async () => {
    setModalVisible(true);
    
    if (cvs.length > 0) {
      // Already loaded CVs
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/personas/${personaId}/cvs`);
      if (!response.ok) {
        throw new Error('Failed to fetch persona CVs');
      }
      
      const data = await response.json();
      setCvs(data);
      
      if (data.length === 0) {
        message.info('No CVs found for this persona');
      }
    } catch (error) {
      console.error('Error fetching persona CVs:', error);
      message.error('Error loading CV files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="link" 
        onClick={handleViewCvs}
        icon={<FileTextOutlined />}
      >
        {buttonText}
      </Button>
      
      <Modal
        title="Persona CVs"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Spin spinning={loading} indicator={<LoadingOutlined />}>
          {cvs.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={cvs}
              renderItem={cv => (
                <List.Item
                  actions={[
                    <CvViewerButton
                      key="view"
                      apiEndpoint={`/api/cv/${cv.id}/view`}
                      buttonText="View"
                      buttonType="primary"
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={cv.filename || 'CV Document'}
                    description={`CV ID: ${cv.id}`}
                  />
                </List.Item>
              )}
            />
          ) : !loading && (
            <div className="text-center py-6">
              {cvs.length === 0 ? 'No CVs found for this persona' : 'Loading CVs...'}
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default PersonaCvsButton;
