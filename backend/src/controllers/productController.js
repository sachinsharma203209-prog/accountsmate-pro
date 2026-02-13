import { prisma } from '../config/prisma.js';

export async function getProducts(req, res, next) {
  try {
    const { categoryId, search } = req.query;
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (e) { next(e); }
}

export async function getProductById(req, res, next) {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) { next(e); }
}

export async function createProduct(req, res, next) {
  try {
    const data = await prisma.product.create({ data: { ...req.body, price: Number(req.body.price), stock: Number(req.body.stock), categoryId: Number(req.body.categoryId) } });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

export async function updateProduct(req, res, next) {
  try {
    const data = await prisma.product.update({ where: { id: Number(req.params.id) }, data: { ...req.body, ...(req.body.price ? { price: Number(req.body.price) } : {}), ...(req.body.stock ? { stock: Number(req.body.stock) } : {}), ...(req.body.categoryId ? { categoryId: Number(req.body.categoryId) } : {}) } });
    res.json(data);
  } catch (e) { next(e); }
}

export async function deleteProduct(req, res, next) {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) { next(e); }
}
