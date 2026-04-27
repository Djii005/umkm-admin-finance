import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
  return NextResponse.json(user);
}
