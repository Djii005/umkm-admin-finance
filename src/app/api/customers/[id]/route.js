import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(params.id) },
    include: { transactions: { orderBy: { date: 'desc' }, take: 10 } },
  });
  if (!customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address } = await request.json();
    const customer = await prisma.customer.update({ where: { id: parseInt(params.id) }, data: { name, phone, address } });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await prisma.customer.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
