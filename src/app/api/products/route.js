import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId');

  const where = {
    AND: [
      search ? { name: { contains: search } } : {},
      categoryId ? { categoryId: parseInt(categoryId) } : {},
    ],
  };

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(products);
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const { name, sku, categoryId, buyPrice, sellPrice, stock, unit, minStock, image } = data;
    if (!name || !sku || !categoryId) {
      return NextResponse.json({ error: 'Nama, SKU, dan kategori wajib diisi' }, { status: 400 });
    }
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: parseInt(categoryId),
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        stock: parseInt(stock) || 0,
        unit: unit || 'pcs',
        minStock: parseInt(minStock) || 5,
        image: image || null,
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
