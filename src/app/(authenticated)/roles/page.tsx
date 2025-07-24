'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PermissionGuard } from '@/app/components/PermissionGuard';
import { Role, Permission } from '@/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      message.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      message.error('Failed to fetch permissions');
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystem) {
      message.warning('System roles cannot be edited');
      return;
    }
    
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissionIds: role.permissions?.map(permName => 
        permissions.find(p => p.name === permName)?.id
      ).filter(Boolean) || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchRoles();
      } else {
        const data = await response.json();
        message.error(data.error || 'Operation failed');
      }
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Role) => (
        <Space>
          {name}
          {record.isSystem && (
            <Tooltip title="System role - cannot be modified">
              <Tag color="orange">System</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (record: Role) => (
        <Space wrap>
          {record.permissions?.slice(0, 3).map(perm => (
            <Tag key={perm} color="blue" style={{ fontSize: '11px' }}>
              {perm}
            </Tag>
          ))}
          {record.permissions && record.permissions.length > 3 && (
            <Tag color="default">+{record.permissions.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Role) => (
        <Space>
          <PermissionGuard permission={{ resource: 'roles', action: 'update' }}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
              disabled={record.isSystem}
            />
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1>Role Management</h1>
        <PermissionGuard permission={{ resource: 'roles', action: 'create' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
            Add Role
          </Button>
        </PermissionGuard>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="permissionIds"
            label="Permissions"
          >
            <Select
              mode="multiple"
              placeholder="Select permissions"
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <Select.OptGroup key={resource} label={resource.toUpperCase()}>
                  {perms.map(perm => (
                    <Select.Option
                      key={perm.id}
                      value={perm.id}
                      label={perm.name}
                    >
                      <div>
                        <strong>{perm.name}</strong>
                        {perm.description && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {perm.description}
                          </div>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}