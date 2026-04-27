import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      supplier: true,
      user: { select: { name: true } },
      items: { include: { product: true } },
    },
  });
  if (!transaction) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  return NextResponse.json(transaction);
}

export async function PUT(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const data = await request.json();
    const { paymentStatus, paymentMethod, notes } = data;
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { paymentStatus, paymentMethod, notes },
      include: {
        customer: true,
        supplier: true,
        items: { include: { product: true } },
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });
    if (!transaction) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Revert stock changes
      for (const item of transaction.items) {
        if (transaction.type === 'SALE') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          });
        }
      }
      await tx.transactionItem.deleteMany({ where: { transactionId: parseInt(id) } });
      await tx.transaction.delete({ where: { id: parseInt(id) } });
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
