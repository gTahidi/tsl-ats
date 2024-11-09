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
    <Flex justify="center" align="center" vertical gap="middle">
      <Image src={Logo} alt="OSS ATS Logo" width={128} height={128} />
      <Typography.Title level={2}>
        The OSS ATS Platform
      </Typography.Title>
      <Typography.Text>
        Enter your admin password to access the platform!
      </Typography.Text>
      <Flex vertical style={{ minWidth: '30%' }} gap={2}>
        <Form
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
