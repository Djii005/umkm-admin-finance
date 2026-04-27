import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    include: { transactions: { orderBy: { date: 'desc' }, take: 10 } },
  });
  if (!customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    const { name, phone, address } = await request.json();
    const customer = await prisma.customer.update({ where: { id: parseInt(id) }, data: { name, phone, address } });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    await prisma.customer.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
