'use client';

import React, { useEffect } from 'react';
import { Button, Card, Typography, Space } from 'antd';
import { faro } from '@grafana/faro-web-sdk';

const { Title, Paragraph } = Typography;

export default function FaroTestPage() {
  useEffect(() => {
    // Log a page view event
    faro.api.pushEvent('faro_test_page_viewed');
    
    // Set a user
    faro.api.setUser({
      id: 'test-user-123',
      email: 'test@example.com'
    });
  }, []);

  const handleLogMessage = () => {
    faro.api.pushLog(['This is a test log message from the Faro test page']);
  };

  const handleLogError = () => {
    try {
      throw new Error('This is a test error from the Faro test page');
    } catch (error) {
      faro.api.pushError(error as Error);
    }
  };

  const handleLogEvent = () => {
    faro.api.pushEvent('test_button_clicked');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Faro Test Page</Title>
        <Paragraph>
          This page is used to test the Grafana Faro integration. Various events, logs, and errors generated here should be captured by Faro and sent to your Grafana Cloud instance.
        </Paragraph>
        
        <Space style={{ marginTop: '24px' }}>
          <Button onClick={handleLogMessage} type="primary">
            Log Message
          </Button>
          <Button onClick={handleLogError} danger>
            Log Error
          </Button>
          <Button onClick={handleLogEvent}>
            Log Event
          </Button>
        </Space>
      </Card>
    </div>
  );
}
