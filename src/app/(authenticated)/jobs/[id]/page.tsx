'use client';

import { useEffect } from 'react';
import { Spin, Card } from 'antd';
import { useRouter } from 'next/navigation';

export default function JobIdRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.push(`/jobs/${params.id}/candidates`);
  }, [params.id, router]);

  return (
    <Card>
      <Spin />
    </Card>
  );
}
