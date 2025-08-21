import { NextResponse } from 'next/server';
import { getPostmarkTemplates } from '@/lib/email';

export async function GET() {
  try {
    const templates = await getPostmarkTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('API Error fetching Postmark templates:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}
