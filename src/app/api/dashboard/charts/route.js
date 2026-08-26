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
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }

  const startDate = months[0];

  const [salesList, expensesList] = await Promise.all([
    prisma.transaction.findMany({
      where: { type: 'SALE', date: { gte: startDate } },
      select: { date: true, total: true },
    }),
    prisma.finance.findMany({
      where: { type: 'EXPENSE', date: { gte: startDate } },
      select: { date: true, amount: true },
    }),
  ]);

  const data = months.map((monthStart) => {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthSales = salesList
      .filter((s) => {
        const d = new Date(s.date);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const monthExpenses = expensesList
      .filter((e) => {
        const d = new Date(e.date);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const label = monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    return {
      month: label,
      penjualan: monthSales,
      pengeluaran: monthExpenses,
    };
  });

  return NextResponse.json(data);
}
