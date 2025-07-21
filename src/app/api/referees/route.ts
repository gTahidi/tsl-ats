import { NextResponse } from 'next/server';
import { db } from '@/db';
import { referees, cvs } from '@/db/schema';
import { sql, asc, desc, ilike } from 'drizzle-orm';

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
  const organizationFilter = searchParams.get('organization');

  if (nameFilter) {
    filters.push(ilike(referees.name, `%${nameFilter}%`));
  }
  if (emailFilter) {
    filters.push(ilike(referees.email, `%${emailFilter}%`));
  }
  if (organizationFilter) {
    filters.push(ilike(referees.organization, `%${organizationFilter}%`));
  }

  try {
    const whereClause = filters.length > 0 ? sql.join(filters, sql` AND `) : undefined;

    const data = await db
      .select({
        id: referees.id,
        name: referees.name,
        email: referees.email,
        phone: referees.phone,
        organization: referees.organization,
        cvId: referees.cvId,
        fileUrl: cvs.fileUrl,
        originalFilename: cvs.originalFilename
      })
      .from(referees)
      .leftJoin(cvs, sql`${referees.cvId} = ${cvs.id}`)
      .where(whereClause)
      .orderBy(orderBy(referees[sortColumn as keyof typeof referees.$inferSelect]))
      .limit(limit)
      .offset(offset);

    const totalRecords = await db
      .select({ count: sql<number>`count(*)` })
      .from(referees)
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
    console.error('Failed to fetch referees:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch referees', details: message }, { status: 500 });
  }
}
