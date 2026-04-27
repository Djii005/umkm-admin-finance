import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const category = await prisma.category.findUnique({ where: { id: parseInt(params.id) } });
  if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, type } = await request.json();
    const category = await prisma.category.update({ where: { id: parseInt(params.id) }, data: { name, type } });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await prisma.category.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
