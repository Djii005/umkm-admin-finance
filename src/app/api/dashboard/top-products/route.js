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

  const products = await Promise.all(
    topItems.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      return { ...product, totalQty: item._sum.qty };
    })
  );

  return NextResponse.json(products);
}
