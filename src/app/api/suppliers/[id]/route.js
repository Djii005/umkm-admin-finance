import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const supplier = await prisma.supplier.findUnique({
    where: { id: parseInt(id) },
    include: { transactions: { orderBy: { date: 'desc' }, take: 10 } },
  });
  if (!supplier) return NextResponse.json({ error: 'Pemasok tidak ditemukan' }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PUT(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    const { name, phone, address, email } = await request.json();
    const supplier = await prisma.supplier.update({ where: { id: parseInt(id) }, data: { name, phone, address, email } });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await context.params;
    await prisma.supplier.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Pemasok berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
