import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'STAFF' },
    });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
