import { prisma } from '../config/prisma.js';

export async function getMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) { next(e); }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: { include: { product: true } }, user: true } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (e) { next(e); }
}

export async function getAllOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({ include: { user: true, items: true }, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (e) { next(e); }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await prisma.order.update({ where: { id: Number(req.params.id) }, data: { orderStatus: req.body.orderStatus } });
    res.json(order);
  } catch (e) { next(e); }
}
