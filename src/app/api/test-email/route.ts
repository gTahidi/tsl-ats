import { NextRequest, NextResponse } from 'next/server';
import { sendCvReceivedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('apiKey');

    if (apiKey !== process.env.INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Use a real email address you can check for testing ---
    const testRecipientEmail = 'daniel@ujaotech.com'; // IMPORTANT: Change this to your email for testing

    try {
        console.log(`Sending test email to ${testRecipientEmail}...`);
        await sendCvReceivedEmail(
            testRecipientEmail,
            'Test Candidate',
            'Sample Job Position'
        );

        return NextResponse.json({ success: true, message: `Test email sent to ${testRecipientEmail}. Please check the console for the Postmark API response.` });

    } catch (error) {
        console.error('Error sending test email:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Failed to send test email', details: errorMessage }, { status: 500 });
    }
}
