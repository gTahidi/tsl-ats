'use client';

import React from 'react';
import LegacyTable from '../components/legacy-table';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const LegacyDashboardPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Legacy Candidate Database</Title>
      <Card>
        <Paragraph style={{ marginBottom: '16px' }}>
          This table displays the candidate data imported from the legacy Excel file. You can sort by clicking on the column headers and use the search boxes to filter the results in real-time.
        </Paragraph>
        <LegacyTable />
      </Card>
    </div>
  );
};

export default LegacyDashboardPage;