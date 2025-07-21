'use client';

import React from 'react';
import RefereesTable from '../components/referees-table';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const RefereesPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Referees Database</Title>
      <Card>
        <Paragraph style={{ marginBottom: '16px' }}>
          This table displays all referees from the database. You can sort by clicking on the column headers and use the search boxes to filter the results.
        </Paragraph>
        <RefereesTable />
      </Card>
    </div>
  );
};

export default RefereesPage;
