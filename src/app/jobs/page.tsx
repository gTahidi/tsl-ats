'use client';

import { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';

interface JobPosting {
  id: string;
  title: string;
  status: string;
  linkedinUrl: string;
  createdAt: string;
  candidates: any[];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: JobPosting) => (
        <Link href={`/jobs/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Candidates',
      key: 'candidates',
      render: (_: any, record: JobPosting) => (
        <Link href={`/jobs/${record.id}/candidates`}>
          {record.candidates.length} candidates
        </Link>
      ),
    },
    {
      title: 'LinkedIn',
      dataIndex: 'linkedinUrl',
      key: 'linkedinUrl',
      render: (url: string) => url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          View
        </a>
      ) : null,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: JobPosting) => (
        <Link href={`/jobs/${record.id}/edit`}>Edit</Link>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Job Postings</h1>
      <Link href="/jobs/new">
        <Button type="primary" icon={<PlusOutlined />} className="mb-4">
          New Job
        </Button>
      </Link>
      <Table
        columns={columns}
        dataSource={jobs}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
}
