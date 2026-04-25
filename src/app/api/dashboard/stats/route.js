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

  const salesToday = await prisma.transaction.aggregate({
    where: { type: 'SALE', date: { gte: today, lt: tomorrow } },
    _sum: { total: true },
  });

  const totalIncome = await prisma.finance.aggregate({
    where: { type: 'INCOME' },
    _sum: { amount: true },
  });

  const totalExpense = await prisma.finance.aggregate({
    where: { type: 'EXPENSE' },
    _sum: { amount: true },
  });

  const lowStockCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Product WHERE stock <= minStock AND active = 1`;

  const income = totalIncome._sum.amount || 0;
  const expense = totalExpense._sum.amount || 0;

  const totalSales = await prisma.transaction.aggregate({
    where: { type: 'SALE' },
    _sum: { total: true },
  });

  const totalSalesAmount = totalSales._sum.total || 0;

  return NextResponse.json({
    salesToday: salesToday._sum.total || 0,
    totalIncome: income + totalSalesAmount,
    totalExpense: expense,
    profit: income + totalSalesAmount - expense,
    lowStockCount: Number(lowStockCount[0]?.count || 0),
  });
}
