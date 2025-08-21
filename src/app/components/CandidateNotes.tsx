'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Button, List, Avatar, Typography, message, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface CandidateNotesProps {
  candidateId: string;
}

const fetchNotes = async (candidateId: string): Promise<Note[]> => {
  const response = await fetch(`/api/candidates/${candidateId}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

const addNote = async ({ candidateId, content }: { candidateId: string; content: string }): Promise<Note> => {
  const response = await fetch(`/api/candidates/${candidateId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('Failed to add note');
  }
  return response.json();
};

const CandidateNotes: React.FC<CandidateNotesProps> = ({ candidateId }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery<Note[]>({ 
    queryKey: ['notes', candidateId], 
    queryFn: () => fetchNotes(candidateId) 
  });

  const mutation = useMutation({
    mutationFn: addNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', candidateId] });
      form.resetFields();
      message.success('Note added successfully');
    },
    onError: () => {
      message.error('Failed to add note');
    },
  });

  const onFinish = (values: { content: string }) => {
    mutation.mutate({ candidateId, content: values.content });
  };

  return (
    <Card title="Notes">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
      ) : (
        <List
          dataSource={notes}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.author}
                description={item.content}
              />
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                {dayjs(item.createdAt).fromNow()}
              </Typography.Text>
            </List.Item>
          )}
          locale={{ emptyText: 'No notes yet.' }}
        />
      )}
      <Form form={form} onFinish={onFinish} style={{ marginTop: '20px' }}>
        <Form.Item name="content" rules={[{ required: true, message: 'Please enter a note' }]}>
          <Input.TextArea rows={3} placeholder="Add a new note..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Add Note
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CandidateNotes;
