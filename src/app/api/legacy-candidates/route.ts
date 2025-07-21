import { NextResponse } from 'next/server';
import { db } from '@/db';
import { legacyCandidates } from '@/db/schema';
import { sql, asc, desc, ilike, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  // Sorting
  const sortColumn = searchParams.get('sort') || 'createdAt';
  const sortOrder = searchParams.get('order') || 'desc';
  const orderBy = sortOrder === 'asc' ? asc : desc;

  // Filtering
  const filters: any[] = [];
  const nameFilter = searchParams.get('name');
  const emailFilter = searchParams.get('email');
  const qualificationsFilter = searchParams.get('qualifications');

  if (nameFilter) {
    filters.push(ilike(legacyCandidates.name, `%${nameFilter}%`));
  }
  if (emailFilter) {
    filters.push(ilike(legacyCandidates.email, `%${emailFilter}%`));
  }
  if (qualificationsFilter) {
    filters.push(ilike(legacyCandidates.qualifications, `%${qualificationsFilter}%`));
  }

  try {
    const whereClause = filters.length > 0 ? sql.join(filters, sql` AND `) : undefined;

    const data = await db
      .select()
      .from(legacyCandidates)
      .where(whereClause)
      .orderBy(orderBy(legacyCandidates[sortColumn as keyof typeof legacyCandidates.$inferSelect]))
      .limit(limit)
      .offset(offset);

    const totalRecords = await db
      .select({ count: sql<number>`count(*)` })
      .from(legacyCandidates)
      .where(whereClause);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: totalRecords[0].count,
        totalPages: Math.ceil(totalRecords[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch legacy candidates:', error);
    // Check for a known error type if possible, otherwise default to 500
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch legacy candidates', details: message }, { status: 500 });
  }
}
