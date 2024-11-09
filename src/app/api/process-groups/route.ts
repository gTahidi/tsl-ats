import { prisma } from '@/utils/db/prisma';
import { ProcessStepTemplate } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const groups = await prisma.processGroup.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                steps: true,
            },
        });
        return NextResponse.json(groups);
    } catch (error) {
        console.error('Error fetching process groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch process groups' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const group = await prisma.$transaction(async (tx) => {
            const upserted = await tx.processGroup.upsert({
                where: { id: data.id },
                update: {
                    ...data,
                    steps: undefined,
                },
                create: {
                    ...data,
                    steps: undefined,
                }
            });

            // TODO: Make this more efficient
            if (data.steps) {
                for (const step of data.steps as ProcessStepTemplate[]) {
                    step.groupId = upserted.id;

                    await tx.processStepTemplate.upsert({
                        where: {
                            id: step.id,
                        },
                        update: step,
                        create: step,
                    });
                }
            }

            return prisma.processGroup.findUnique({
                where: { id: data.id },
                include: {
                    steps: true,
                },
            });
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error upserts process group:', error);
        return NextResponse.json(
            { error: 'Failed to upsert process group' },
            { status: 500 }
        );
    }
}
