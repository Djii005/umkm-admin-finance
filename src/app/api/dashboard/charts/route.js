import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }

  const data = await Promise.all(
    months.map(async (monthStart) => {
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const sales = await prisma.transaction.aggregate({
        where: { type: 'SALE', date: { gte: monthStart, lt: monthEnd } },
        _sum: { total: true },
      });

      const expenses = await prisma.finance.aggregate({
        where: { type: 'EXPENSE', date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });

      const label = monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      return {
        month: label,
        penjualan: sales._sum.total || 0,
        pengeluaran: expenses._sum.amount || 0,
      };
    })
  );

  return NextResponse.json(data);
}
