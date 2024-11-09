import { prisma } from '@/utils/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const processStep = await prisma.processStep.findUnique({
            where: { id: params.id },
        });

        if (!processStep) {
            return NextResponse.json(
                { error: 'process step not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(processStep);
    } catch (error) {
        console.error('Error fetching processStep:', error);
        return NextResponse.json(
            { error: 'Failed to fetch process step' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const data = await request.json();
        const processStep = await prisma.processStep.update({
            where: { id: params.id },
            data: data,
        });

        return NextResponse.json(processStep);
    } catch (error) {
        console.error('Error updating process step:', error);
        return NextResponse.json(
            { error: 'Failed to update process step' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.processStep.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'process step deleted successfully' });
    } catch (error) {
        console.error('Error deleting processs step:', error);
        return NextResponse.json(
            { error: 'Failed to delete processs tep' },
            { status: 500 }
        );
    }
}
