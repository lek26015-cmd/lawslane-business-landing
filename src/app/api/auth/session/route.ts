import { NextResponse } from 'next/server';

// export const runtime = 'edge';

export async function POST() {
    return NextResponse.json({ error: 'Auth session is disabled in this environment' }, { status: 501 });
}

export async function GET() {
    return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
    return NextResponse.json({ success: true });
}
