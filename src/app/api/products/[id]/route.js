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
    const productId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const txCount = await prisma.transactionItem.count({ where: { productId } });

    if (txCount > 0 && !force) {
      return NextResponse.json({
        hasTransactions: true,
        txCount,
        error: `Produk ini memiliki riwayat transaksi (${txCount} item). Menonaktifkan produk direkomendasikan agar riwayat penjualan tidak hilang.`,
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (txCount > 0) {
        await tx.transactionItem.deleteMany({ where: { productId } });
      }
      await tx.product.delete({ where: { id: productId } });
    });

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('DELETE product error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
