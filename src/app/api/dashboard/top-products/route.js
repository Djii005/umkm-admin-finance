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

  if (!topItems.length) return NextResponse.json([]);

  const productIds = topItems.map((item) => item.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const result = topItems
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return { ...product, totalQty: item._sum.qty };
    })
    .filter(Boolean);

  return NextResponse.json(result);
}
