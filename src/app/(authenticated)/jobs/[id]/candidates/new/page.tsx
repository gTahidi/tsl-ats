'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Select, Input, Card, Button } from 'antd';
import type { Persona } from '@/types';

export default function NewCandidatePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [form, setForm] = useState({
    email: '',
    name: '',
    linkedinUrl: '',
    notes: '',
  });

  const disabled = loading || form.email.length === 0 || form.name.length === 0;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (disabled) {
      setLoading(false);
      return;
    }

    const data = {
      ...form,
      jobId: params.id,
    };

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create candidate');

      router.push(`/jobs/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch('/api/personas');
        const data = await response.json();
        setPersonas(data.personas);
      } catch (error) {
        console.error('Failed to fetch personas:', error);
        setError('Failed to load personas');
      }
    };

    fetchPersonas();
  }, []);

  return (
    <Card>
      <Typography.Title level={2}>New Candidate</Typography.Title>
      <Card>
        <Select
          placeholder="Select persona"
          style={{ width: '100%', marginBottom: 16 }}
          options={personas.map((persona) => ({
            label: persona.name,
            value: persona.id
          }))}
          onSelect={(value) => {
            const persona = personas.find((p) => p.id === value);
            if (!persona) return;
            setForm({ ...form, name: persona.name, email: persona.email });
          }}
        />
        <Input
          placeholder="LinkedIn URL"
          value={form.linkedinUrl}
          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
          style={{ marginBottom: 16 }}
        />
        <Input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          style={{ marginBottom: 16 }}
        />
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
        {disabled && (
          <Typography.Text type="danger">All fields are required</Typography.Text>
        )}
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          style={{ marginBottom: 16 }}
          disabled={disabled}
        >
          Submit
        </Button>
      </Card>
    </Card>
  );
}
