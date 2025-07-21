'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Space, Spin, Alert, Typography } from 'antd';
import type { TableProps } from 'antd';
import { debounce } from 'lodash';
import CvViewerButton from './cv-viewer-button';

const { Search } = Input;
const { Title } = Typography;

interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  cvId: string;
  fileUrl?: string;
  originalFilename?: string;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const RefereesTable: React.FC = () => {
  const [data, setData] = useState<Referee[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sorter, setSorter] = useState<{ field: string; order: string }>({ field: 'createdAt', order: 'desc' });
  const [filters, setFilters] = useState({ name: '', email: '', organization: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagination.current),
        limit: String(pagination.pageSize),
        sort: sorter.field,
        order: sorter.order,
        name: filters.name,
        email: filters.email,
        organization: filters.organization,
      });

      const response = await fetch(`/api/referees?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch data: ${errorData.details || response.statusText}`);
      }
      const result = await response.json();

      setData(result.data);
      setPagination(prev => ({ ...prev, total: result.pagination.total }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, sorter, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange: TableProps<Referee>['onChange'] = (pagination, tableFilters, newSorter) => {
    setPagination(prev => ({ ...prev, current: pagination.current || 1, pageSize: pagination.pageSize || 10 }));

    if (newSorter && 'field' in newSorter && 'order' in newSorter && newSorter.order) {
      setSorter({ field: String(newSorter.field), order: newSorter.order === 'ascend' ? 'asc' : 'desc' });
    } else {
      setSorter({ field: 'createdAt', order: 'desc' });
    }
  };

  const debouncedFilterChange = useCallback(
    (name: keyof typeof filters, value: string) => {
      const debouncedFn = debounce(() => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
      }, 500);
      debouncedFn();
    },
    []
  );

  

  const columns: TableProps<Referee>['columns'] = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Organization', dataIndex: 'organization', key: 'organization', sorter: true },
    {
      title: 'CV',
      key: 'cv',
      render: (_, record) => (
        <CvViewerButton 
          apiEndpoint={`/api/cv/${record.cvId}/view`}
          iconOnly={false}
          buttonText="View CV"
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Referees ({pagination.total})
      </Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space wrap>
          <Search placeholder="Filter by Name" onChange={e => debouncedFilterChange('name', e.target.value)} style={{ width: 200 }} />
          <Search placeholder="Filter by Email" onChange={e => debouncedFilterChange('email', e.target.value)} style={{ width: 200 }} />
          <Search placeholder="Filter by Organization" onChange={e => debouncedFilterChange('organization', e.target.value)} style={{ width: 200 }} />
        </Space>
        {error && <Alert message="Error" description={error} type="error" showIcon />}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Space>
    </div>
  );
};

export default RefereesTable;
