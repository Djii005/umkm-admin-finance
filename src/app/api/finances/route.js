import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const categoryId = searchParams.get('categoryId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where = {};
  if (type) where.type = type;
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
  }

  const finances = await prisma.finance.findMany({
    where,
    include: { category: true, user: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(finances);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const { type, categoryId, amount, description, date, paymentMethod } = data;
    if (!type || !amount) {
      return NextResponse.json({ error: 'Tipe dan jumlah wajib diisi' }, { status: 400 });
    }
    const finance = await prisma.finance.create({
      data: {
        userId: parseInt(session.user.id),
        type,
        categoryId: categoryId ? parseInt(categoryId) : null,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
      },
      include: { category: true },
    });
    return NextResponse.json(finance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
