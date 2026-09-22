const { Category, Product } = require('../models');

exports.create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const c = await Category.create({ name, description });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const cat = await Category.findByPk(categoryId);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
        const { name, description } = req.body;
        if (name) cat.name = name;
    if (description) cat.description = description;
    await cat.save();
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const cat = await Category.findByPk(categoryId);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    const products = await Product.count({ where: { categoryId } });
    if (products > 0) return res.status(400).json({ success: false, message: 'Cannot delete category with products' });
    await cat.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const list = await Category.findAll();
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

module.exports = exports;
