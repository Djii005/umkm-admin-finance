import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNo } from '@/lib/utils';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where = {};
  if (type) where.type = type;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      customer: true,
      supplier: true,
      user: { select: { name: true } },
      items: { include: { product: true } },
    },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(transactions);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const {
      type,
      customerId,
      supplierId,
      items,
      discount = 0,
      tax = 0,
      paymentMethod,
      paymentStatus = 'PAID',
      notes,
      date,
    } = data;

    if (!type || !items || items.length === 0) {
      return NextResponse.json({ error: 'Tipe dan item transaksi wajib diisi' }, { status: 400 });
    }

    const invoiceNo = await generateInvoiceNo(type, prisma);
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount - discount;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(session.user.id),
          customerId: customerId ? parseInt(customerId) : null,
          supplierId: supplierId ? parseInt(supplierId) : null,
          type,
          invoiceNo,
          date: date ? new Date(date) : new Date(),
          subtotal,
          tax: taxAmount,
          discount: parseFloat(discount),
          total,
          paymentStatus,
          paymentMethod,
          notes,
          items: {
            create: items.map((item) => ({
              productId: parseInt(item.productId),
              qty: parseInt(item.qty),
              price: parseFloat(item.price),
              subtotal: parseInt(item.qty) * parseFloat(item.price),
            })),
          },
        },
        include: { items: { include: { product: true } }, customer: true, supplier: true },
      });

      // Auto update stock
      for (const item of items) {
        if (type === 'SALE') {
          await tx.product.update({
            where: { id: parseInt(item.productId) },
            data: { stock: { decrement: parseInt(item.qty) } },
          });
        } else {
          await tx.product.update({
            where: { id: parseInt(item.productId) },
            data: { stock: { increment: parseInt(item.qty) } },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
