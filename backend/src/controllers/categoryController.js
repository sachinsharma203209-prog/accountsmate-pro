import { prisma } from '../config/prisma.js';

export const getCategories = async (req, res, next) => {
  try {
    const data = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { next(e); }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = await prisma.category.create({ data: { name: req.body.name } });
    res.status(201).json(data);
  } catch (e) { next(e); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await prisma.category.update({ where: { id: Number(req.params.id) }, data: { name: req.body.name } });
    res.json(data);
  } catch (e) { next(e); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) { next(e); }
};
