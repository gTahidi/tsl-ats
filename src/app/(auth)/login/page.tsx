'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image';
import ATSImage from '@/public/ats.jpg';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      message.success('Login successful');
      router.push('/jobs');
    } catch (error) {
      console.error('Login error:', error);
      message.error(error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Left Side - Image */}
      <div 
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <Image 
          src={ATSImage} 
          alt="ATS Platform background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Right Side - Login Form */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Typography.Title level={3} style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              Find Your Next Golden Hire
            </Typography.Title>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<Typography.Text strong>Email</Typography.Text>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                placeholder="Enter your email"
                style={{ borderRadius: '8px', padding: '10px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Typography.Text strong>Password</Typography.Text>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                placeholder="Enter your password"
                style={{ borderRadius: '8px', padding: '10px' }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              © {new Date().getFullYear()} ATS Platform. All rights reserved.
            </Typography.Text>
          </div>
        </div>
      </div>
    </div>
  );
}