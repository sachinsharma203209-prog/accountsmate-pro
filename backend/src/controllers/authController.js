import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { signToken } from '../utils/token.js';

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already used' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, cart: { create: {} } },
      select: { id: true, name: true, email: true, role: true }
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  const { id, name, email, role, createdAt } = req.user;
  res.json({ id, name, email, role, createdAt });
}
