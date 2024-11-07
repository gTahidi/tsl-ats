import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, fileName } = await request.json();

    if (!candidateId || !fileName) {
      return NextResponse.json(
        { error: 'Candidate ID and file name are required' },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful response
    const mockUrl = `mock://${candidateId}/${Date.now()}-${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl: mockUrl,
      message: 'File upload simulated successfully'
    });
  } catch (error) {
    console.error('Mock upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
