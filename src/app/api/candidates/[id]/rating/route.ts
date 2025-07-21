import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch candidate with their rating information
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      columns: {
        rating: true
      }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // If no rating exists, return appropriate response
    if (!candidate.rating) {
      return NextResponse.json(
        { error: 'No rating available for this candidate' },
        { status: 404 }
      );
    }

    // The rating field might already be an object if it was deserialized by the ORM
    // or it might be a JSON string
    try {
      // Check if rating is already an object
      if (typeof candidate.rating === 'object' && candidate.rating !== null) {
        return NextResponse.json(candidate.rating);
      }
      
      // If it's a string that needs parsing
      if (typeof candidate.rating === 'string') {
        const ratingData = JSON.parse(candidate.rating);
        return NextResponse.json(ratingData);
      }
      
      // If we don't have proper rating data
      return NextResponse.json(
        { error: 'Invalid rating format' },
        { status: 500 }
      );
    } catch (parseError) {
      console.error('Error handling rating data:', parseError);
      return NextResponse.json(
        { error: 'Invalid rating format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching candidate rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate rating' },
      { status: 500 }
    );
  }
}
