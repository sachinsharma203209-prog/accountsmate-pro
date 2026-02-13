import { prisma } from '../config/prisma.js';
import { stripe } from '../services/stripeService.js';
import { env } from '../config/env.js';

export async function createCheckoutSession(req, res, next) {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const totalAmount = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.product.price)
          }))
        }
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(item.product.price) * 100),
          product_data: { name: item.product.name, description: item.product.description }
        }
      })),
      success_url: `${env.frontendUrl}/orders/${order.id}?success=true`,
      cancel_url: `${env.frontendUrl}/cart?canceled=true`,
      metadata: { orderId: String(order.id), userId: String(req.user.id) }
    });

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

    res.json({ id: session.id, url: session.url });
  } catch (e) { next(e); }
}

export async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = Number(session.metadata.orderId);

      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: 'PAID', orderStatus: 'PAID' } });
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });

        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }

        await tx.cartItem.deleteMany({ where: { cart: { userId: Number(session.metadata.userId) } } });
      });
    }

    res.json({ received: true });
  } catch (e) { next(e); }
}
