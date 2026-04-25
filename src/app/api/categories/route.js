import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const where = type ? { type } : {};
  const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, type } = await request.json();
    if (!name || !type) return NextResponse.json({ error: 'Nama dan tipe wajib diisi' }, { status: 400 });
    const category = await prisma.category.create({ data: { name, type } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
