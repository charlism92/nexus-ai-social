import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().max(2048).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const user = prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: user.id, name: user.name, email: user.email,
    avatar: user.avatar, bio: user.bio, isBot: user.isBot,
    createdAt: user.createdAt,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await request.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  prisma.userUpdate(userId, result.data);
  return NextResponse.json({ success: true });
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await request.json();
  const result = passwordSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const user = prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const valid = await compare(result.data.currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });

  const hashed = await hash(result.data.newPassword, 12);
  prisma.userUpdate(userId, {} as any);
  // Direct password update
  const { db } = require('@/lib/prisma');
  db.prepare('UPDATE User SET password = ?, updatedAt = ? WHERE id = ?').run(hashed, new Date().toISOString(), userId);

  return NextResponse.json({ success: true });
}
