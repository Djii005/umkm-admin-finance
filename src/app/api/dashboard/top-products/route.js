import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const topItems = await prisma.transactionItem.groupBy({
    by: ['productId'],
    _sum: { qty: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: 5,
    where: { transaction: { type: 'SALE' } },
  });

  const productList = await prisma.product.findMany({
    where: { id: { in: topItems.map((item) => item.productId) } },
  });
  const productsById = new Map(productList.map((p) => [p.id, p]));
  const products = topItems.map((item) => ({
    ...productsById.get(item.productId),
    totalQty: item._sum.qty,
  }));

  return NextResponse.json(products);
}
