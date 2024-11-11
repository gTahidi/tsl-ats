'use client';

import React, { useEffect, useState } from 'react';
import { Button, Flex, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProcessGroupsTable from '../../components/tables/ProcessGroupsTable';
import ProcessGroupModal from '../../components/ProcessGroupModal';
import type { ProcessGroup } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Page(): JSX.Element {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProcessGroup, setEditingProcessGroup] = useState<ProcessGroup | null>(null);
    const qc = useQueryClient();

    useEffect(() => {
        if (editingProcessGroup && !modalVisible) {
            setModalVisible(true);
        }
    }, [editingProcessGroup, modalVisible]);

    const {
        mutateAsync: upsertProcessGroup,
        isPending: upsertPending,
    } = useMutation({
        mutationFn: async (group: ProcessGroup) => {
            const response = await fetch(`/api/process-groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(group),
            });
            if (!response.ok) {
                throw new Error('Failed to upsert group');
            }
            return response.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['processGroups'] });
            qc.invalidateQueries({ queryKey: ['jobs'] });
            qc.invalidateQueries({ queryKey: ['candidates'] });
        },
    });

    const {
        mutateAsync: deleteProcessGroup,
        isPending: deletePending,
    } = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/process-groups/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete group');
            }
            return response.json();
        },
        onSuccess: () => {
            message.success('Process Group deleted successfully');

            qc.invalidateQueries({ queryKey: ['processGroups'] });
            qc.invalidateQueries({ queryKey: ['candidates'] });
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : 'Failed to delete group');
        },
    });

    const handleCreateOrUpdate = async (values: Partial<ProcessGroup>) => {
        if (!values.name) {
            message.error('Name is required');
            return;
        }

        if (!values.steps || values.steps?.length === 0) {
            message.error('At least one step is required');
            return;
        }

        const now = new Date();

        const newProcessGroup: ProcessGroup = editingProcessGroup ? {
            ...editingProcessGroup,
            ...values,
            steps: values.steps.map((step) => {
                const existingStep = editingProcessGroup.steps?.find((s) => s.order === step.order);

                return existingStep ? {
                    ...existingStep,
                    ...step,
                    updatedAt: now,
                } : {
                    ...step,
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                };
            }),
            updatedAt: now,
        } : {
            id: crypto.randomUUID(),
            name: values.name,
            steps: values.steps.map((step) => ({
                ...step,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
            })),
            createdAt: now,
            updatedAt: now,
            metadata: {},
        };

        try {
            await upsertProcessGroup(newProcessGroup);
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Failed to update group');
            return;
        }

        message.success(`Process Group ${editingProcessGroup ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        setEditingProcessGroup(null);
    };

    const handleDelete = async (id: string) => {
        await deleteProcessGroup(id);
    };

    const loading = upsertPending || deletePending;

    return (
        <Flex gap="middle" vertical>
            <Flex justify="space-between" align="center">
                <Typography.Title level={3}>
                    ProcessGroups
                </Typography.Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                >
                    Add Process Group
                </Button>
            </Flex>

            <ProcessGroupsTable
                loading={loading}
                onEdit={setEditingProcessGroup}
                onDelete={handleDelete}
            />

            <ProcessGroupModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingProcessGroup(null);
                }}
                onSubmit={handleCreateOrUpdate}
                group={editingProcessGroup}
            />
        </Flex>
    );
}
