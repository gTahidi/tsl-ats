import { NextResponse } from 'next/server';

export async function POST(_: Request) {
    try {
        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        response.cookies.delete('auth');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
