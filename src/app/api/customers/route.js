import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const customers = await prisma.customer.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(customers);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address } = await request.json();
    if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    const customer = await prisma.customer.create({ data: { name, phone, address } });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
