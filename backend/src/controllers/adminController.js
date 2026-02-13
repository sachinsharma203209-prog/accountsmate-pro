import { prisma } from '../config/prisma.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [users, products, orders, sales] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'PAID' } })
    ]);

    res.json({ totalUsers: users, totalProducts: products, totalOrders: orders, totalSales: Number(sales._sum.totalAmount || 0) });
  } catch (e) { next(e); }
}

export async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
    res.json(users);
  } catch (e) { next(e); }
}

export async function updateUserRole(req, res, next) {
  try {
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { role: req.body.role } });
    res.json({ id: user.id, role: user.role });
  } catch (e) { next(e); }
}
