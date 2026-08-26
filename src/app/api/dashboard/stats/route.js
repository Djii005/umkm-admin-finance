import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [salesToday, totalIncome, totalExpense, lowStockRows, totalSales] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'SALE', date: { gte: today, lt: tomorrow } },
      _sum: { total: true },
    }),
    prisma.finance.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.finance.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.$queryRaw`
      SELECT id, name, unit, stock, "minStock", COUNT(*) OVER() AS "totalCount"
      FROM "Product"
      WHERE active = true AND stock <= "minStock"
      ORDER BY stock ASC
      LIMIT 5
    `,
    prisma.transaction.aggregate({
      where: { type: 'SALE' },
      _sum: { total: true },
    }),
  ]);

  const income = totalIncome._sum.amount || 0;
  const expense = totalExpense._sum.amount || 0;
  const totalSalesAmount = totalSales._sum.total || 0;
  const lowStockCount = lowStockRows.length ? Number(lowStockRows[0].totalCount) : 0;

  return NextResponse.json({
    salesToday: salesToday._sum.total || 0,
    totalIncome: income + totalSalesAmount,
    totalExpense: expense,
    profit: income + totalSalesAmount - expense,
    lowStockProducts: lowStockRows.map(({ totalCount, ...p }) => p),
    lowStockCount,
  });
}
