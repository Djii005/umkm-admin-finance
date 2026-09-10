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
    const txId = parseInt(id);
    const data = await request.json();
    const { paymentStatus, paymentMethod, notes } = data;

    const existing = await prisma.transaction.findUnique({
      where: { id: txId },
      include: { customer: true, supplier: true },
    });
    if (!existing) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: txId },
        data: {
          ...(paymentStatus !== undefined ? { paymentStatus } : {}),
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          customer: true,
          supplier: true,
          items: { include: { product: true } },
        },
      });

      // Synchronize with Keuangan (Finance)
      if (paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID') {
        const isSale = updated.type === 'SALE';
        const financeType = isSale ? 'INCOME' : 'EXPENSE';

        let category;
        if (isSale) {
          category = await tx.category.findFirst({
            where: { type: 'INCOME', name: { contains: 'Penjualan', mode: 'insensitive' } },
          }) || await tx.category.findFirst({ where: { type: 'INCOME' } });
          if (!category) {
            category = await tx.category.create({ data: { name: 'Penjualan Produk', type: 'INCOME' } });
          }
        } else {
          category = await tx.category.findFirst({
            where: { type: 'EXPENSE', name: { contains: 'Operasional', mode: 'insensitive' } },
          }) || await tx.category.findFirst({ where: { type: 'EXPENSE' } });
          if (!category) {
            category = await tx.category.create({ data: { name: 'Operasional', type: 'EXPENSE' } });
          }
        }

        const party = updated.customer?.name || updated.supplier?.name || '';
        const desc = `${isSale ? 'Pelunasan Penjualan' : 'Pelunasan Pembelian'} ${updated.invoiceNo}${party ? ' - ' + party : ''}`;

        const existingFinance = await tx.finance.findFirst({
          where: { description: { contains: updated.invoiceNo } },
        });

        if (!existingFinance) {
          await tx.finance.create({
            data: {
              userId: parseInt(session.user.id),
              type: financeType,
              categoryId: category.id,
              amount: updated.total,
              date: new Date(),
              description: desc,
            },
          });
        }
      } else if (paymentStatus === 'UNPAID' && existing.paymentStatus === 'PAID') {
        await tx.finance.deleteMany({
          where: { description: { contains: updated.invoiceNo } },
        });
      }

      return updated;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('PUT transaction error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
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
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: transaction.type === 'SALE' ? item.qty : -item.qty,
              },
            },
          });
        }
      }
      await tx.finance.deleteMany({ where: { description: { contains: transaction.invoiceNo } } });
      await tx.transactionItem.deleteMany({ where: { transactionId: parseInt(id) } });
      await tx.transaction.delete({ where: { id: parseInt(id) } });
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('DELETE transaction error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
