'use client';

import React, { useState } from 'react';
import { Modal, Select, Button, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';

interface BulkEmailModalProps {
  visible: boolean;
  candidateIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const fetchTemplates = async () => {
  const response = await fetch('/api/email-templates');
  if (!response.ok) {
    throw new Error('Failed to fetch email templates');
  }
  return response.json();
};

const sendBulkEmail = async ({ candidateIds, templateAlias }: { candidateIds: string[], templateAlias: string }) => {
  const response = await fetch('/api/candidates/bulk-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateIds, templateAlias, templateModel: {} }), // Passing an empty model for now
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send bulk email');
  }
  return response.json();
};

const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ visible, candidateIds, onClose, onSuccess }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
    enabled: visible, // Only fetch when the modal is visible
  });

  const mutation = useMutation({ 
    mutationFn: sendBulkEmail,
    onSuccess: () => {
      message.success('Bulk email sent successfully!');
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message);
    }
  });

  const handleSend = () => {
    if (!selectedTemplate) {
      message.warning('Please select an email template.');
      return;
    }
    mutation.mutate({ candidateIds, templateAlias: selectedTemplate });
  };

  return (
    <Modal
      title={`Send Email to ${candidateIds.length} Candidate(s)`}
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={mutation.isPending}
          onClick={handleSend}
          disabled={!selectedTemplate}
        >
          Send Email
        </Button>,
      ]}
    >
      <Select
        style={{ width: '100%' }}
        placeholder="Select an email template"
        loading={isLoadingTemplates}
        onChange={(value) => setSelectedTemplate(value)}
        value={selectedTemplate}
      >
        {templates?.map((template: { Name: string; Alias: string }) => (
          <Select.Option key={template.Alias} value={template.Alias}>
            {template.Name}
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
};

export default BulkEmailModal;
