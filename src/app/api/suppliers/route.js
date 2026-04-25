import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const suppliers = await prisma.supplier.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address, email } = await request.json();
    if (!name) return NextResponse.json({ error: 'Nama pemasok wajib diisi' }, { status: 400 });
    const supplier = await prisma.supplier.create({ data: { name, phone, address, email } });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
