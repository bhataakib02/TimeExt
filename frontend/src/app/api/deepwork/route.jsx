import { NextResponse } from 'next/server';
import dbConnect from '@backend/db/mongodb';
import DeepWorkSession from '@backend/models/DeepWorkSession';

const MOCK_USER_ID = "65f1a2b3c4d5e6f7a8b9c0d1";

export async function GET() {
    try {
        await dbConnect();
        const sessions = await DeepWorkSession.find({ userId: MOCK_USER_ID }).sort({ startTime: -1 }).limit(10);
        return NextResponse.json(sessions);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const session = await DeepWorkSession.create({ ...body, userId: MOCK_USER_ID });
        return NextResponse.json(session);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
