'use client';

import React, { useEffect, useState } from 'react';
import { Button, Flex, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PersonasTable from '../../components/tables/PersonasTable';
import PersonaModal from '../../components/PersonaModal';
import type { Persona } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Page(): JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (editingPersona && !modalVisible) {
      setModalVisible(true);
    }
  }, [editingPersona, modalVisible]);

  const {
    mutateAsync: updatePersona,
    isPending: updatePending,
  } = useMutation({
    mutationFn: async (persona: Persona) => {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(persona),
      });
      if (!response.ok) {
        throw new Error('Failed to update persona');
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
    },
  });

  const {
    mutateAsync: deletePersona,
    isPending: deletePending,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personas/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete persona');
      }
      return response.json();
    },
    onSuccess: () => {
      message.success('Persona deleted successfully');
      qc.invalidateQueries({ queryKey: ['personas'] });
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Failed to delete persona');
    },
  });

  const handleCreateOrUpdate = async (values: Partial<Persona>) => {
    if (!values.name || !values.surname || !values.email) {
      message.error('Missing fields: name, surname, email');
      return;
    }

    const now = new Date();

    const newPersona: Persona = editingPersona ? {
      ...editingPersona,
      ...values,
      updatedAt: now,
    } : {
      id: crypto.randomUUID(),
      name: values.name,
      surname: values.surname,
      email: values.email,
      linkedinUrl: values.linkedinUrl,
      location: values.location,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };

    try {
      await updatePersona(newPersona);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to update persona');
      return;
    }

    message.success(`Persona ${editingPersona ? 'updated' : 'created'} successfully`);
    setModalVisible(false);
    setEditingPersona(null);
  };

  const handleDelete = async (id: string) => {
    await deletePersona(id);
  };

  const loading = updatePending || deletePending;

  return (
    <Flex gap="middle" vertical>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3}>
          Personas
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Persona
        </Button>
      </Flex>

      <PersonasTable
        loading={loading}
        onEdit={setEditingPersona}
        onDelete={handleDelete}
      />

      <PersonaModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingPersona(null);
        }}
        onSubmit={handleCreateOrUpdate}
        persona={editingPersona}
      />
    </Flex>
  );
}
