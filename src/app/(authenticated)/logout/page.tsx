'use client';

import { Flex, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Logout() {
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });

            router.push('/login');
        };

        logout();
    }, [router]);

    return (
        <Flex justify="center" align="center">
            <Spin size="large" />
        </Flex>
    )
}
