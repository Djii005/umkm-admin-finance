import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const data = await request.json();
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: parseInt(data.categoryId),
        buyPrice: parseFloat(data.buyPrice) || 0,
        sellPrice: parseFloat(data.sellPrice) || 0,
        stock: parseInt(data.stock) || 0,
        unit: data.unit || 'pcs',
        minStock: parseInt(data.minStock) || 5,
        image: data.image || null,
        active: data.active !== undefined ? data.active : true,
      },
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
