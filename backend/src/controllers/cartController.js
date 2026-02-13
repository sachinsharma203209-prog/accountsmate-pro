import { prisma } from '../config/prisma.js';

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: { items: { include: { product: true } } } });
  }
  return cart;
}

export async function getMyCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (e) { next(e); }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const cart = await getOrCreateCart(req.user.id);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
      update: { quantity: { increment: Number(quantity) } },
      create: { cartId: cart.id, productId: Number(productId), quantity: Number(quantity) }
    });

    const updated = await getOrCreateCart(req.user.id);
    res.status(201).json(updated);
  } catch (e) { next(e); }
}

export async function updateCartItem(req, res, next) {
  try {
    const id = Number(req.params.itemId);
    const quantity = Number(req.body.quantity);
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      await prisma.cartItem.update({ where: { id }, data: { quantity } });
    }
    const updated = await getOrCreateCart(req.user.id);
    res.json(updated);
  } catch (e) { next(e); }
}

export async function removeCartItem(req, res, next) {
  try {
    await prisma.cartItem.delete({ where: { id: Number(req.params.itemId) } });
    const updated = await getOrCreateCart(req.user.id);
    res.json(updated);
  } catch (e) { next(e); }
}
