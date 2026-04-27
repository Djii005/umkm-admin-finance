import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const finance = await prisma.finance.findUnique({
    where: { id: parseInt(id) },
    include: { category: true, user: { select: { name: true } } },
  });
  if (!finance) return NextResponse.json({ error: 'Data keuangan tidak ditemukan' }, { status: 404 });
  return NextResponse.json(finance);
}

export async function PUT(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const data = await request.json();
    const { type, categoryId, amount, description, date, paymentMethod } = data;
    const finance = await prisma.finance.update({
      where: { id: parseInt(id) },
      data: {
        type,
        categoryId: categoryId ? parseInt(categoryId) : null,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : undefined,
        paymentMethod,
      },
      include: { category: true },
    });
    return NextResponse.json(finance);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    await prisma.finance.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Data keuangan berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
