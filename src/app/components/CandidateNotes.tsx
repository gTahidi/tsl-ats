'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Button, Avatar, Typography, message, Spin } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068', '#ff85c0'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Card 
      title="Notes" 
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ 
        flex: 1, 
        padding: '16px', 
        overflowY: 'auto',
        background: '#fafafa',
        minHeight: '300px'
      }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <Spin />
          </div>
        ) : notes && notes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notes.map((note, index) => (
              <div key={note.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginLeft: index % 2 === 1 ? '20px' : '0',
                marginRight: index % 2 === 0 ? '20px' : '0'
              }}>
                <Avatar 
                  size={40}
                  style={{ 
                    backgroundColor: getAvatarColor(note.author),
                    flexShrink: 0
                  }}
                >
                  {getInitials(note.author)}
                </Avatar>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f0',
                  maxWidth: '80%',
                  position: 'relative'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: '4px'
                  }}>
                    {note.author}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#595959',
                    lineHeight: '1.5',
                    marginBottom: '8px'
                  }}>
                    {note.content}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#8c8c8c'
                  }}>
                    {dayjs(note.createdAt).fromNow()}
                  </div>
                  {/* Chat bubble tail */}
                  <div style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '16px',
                    width: 0,
                    height: 0,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid #ffffff'
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8c8c8c'
          }}>
            <Typography.Text type="secondary" style={{ fontSize: '16px' }}>
              No notes yet. Start the conversation!
            </Typography.Text>
          </div>
        )}
      </div>
      
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        background: '#ffffff'
      }}>
        <Form form={form} onFinish={onFinish}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <Form.Item 
              name="content" 
              rules={[{ required: true, message: 'Please enter a note' }]}
              style={{ flex: 1, margin: 0 }}
            >
              <Input.TextArea 
                rows={2} 
                placeholder="Type your note here..."
                style={{
                  borderRadius: '12px',
                  resize: 'none'
                }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    form.submit();
                  }
                }}
              />
            </Form.Item>
            <Form.Item style={{ margin: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={mutation.isPending}
                icon={<SendOutlined />}
                style={{
                  borderRadius: '12px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Card>
  );
};

export default CandidateNotes;
