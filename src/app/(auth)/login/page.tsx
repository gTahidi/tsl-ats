'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Flex, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Logo from "@/public/ats-oss.png"
import Image from 'next/image'


interface LoginFormData {
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

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      Cookies.set('auth', 'true', { expires: 7 });
      message.success('Login successful');
      router.push('/jobs');
    } catch (error) {
      console.error('Login error:', error);
      message.error('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" vertical gap="middle" style={{ height: '100vh' }}>
      <Typography.Title level={2}>
        Qchungi 0.0.1
      </Typography.Title>
      <Typography.Text style={{ fontSize: '18px', fontWeight: 500, color: '#7B8C98', marginBottom: '16px' }}>
        Helping you find hidden gems
      </Typography.Text>
      <Image src={Logo} alt="Qchungi Logo" width={300} height={300} />
      <Typography.Text>
        Enter your admin password to access the platform!
      </Typography.Text>
      <Typography.Text type="secondary" style={{ textAlign: 'center', marginTop: '8px' }}>
        The login page above (with OTP) is a demo
      </Typography.Text>
      <Flex vertical style={{ minWidth: '30%' }} gap={2}>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              size="large"
              placeholder="Password"
            />
          </Form.Item>

          <Typography.Text type="secondary">
            For testing purposes, the password is <Typography.Text code copyable>admin</Typography.Text>
          </Typography.Text>

          <Flex justify="end">
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Sign in
              </Button>
            </Form.Item>
          </Flex>
        </Form>
      </Flex>
    </Flex>
  );
}