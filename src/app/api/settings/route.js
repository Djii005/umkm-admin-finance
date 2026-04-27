import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let business = await prisma.business.findFirst();
  if (!business) {
    business = await prisma.business.create({ data: { name: 'Toko Saya' } });
  }
  return NextResponse.json(business);
}

export async function PUT(request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    let business = await prisma.business.findFirst();
    if (business) {
      business = await prisma.business.update({
        where: { id: business.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          logo: data.logo,
          taxId: data.taxId,
          taxRate: parseFloat(data.taxRate) || 0,
        },
      });
    } else {
      business = await prisma.business.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          logo: data.logo,
          taxId: data.taxId,
          taxRate: parseFloat(data.taxRate) || 0,
        },
      });
    }
    return NextResponse.json(business);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
