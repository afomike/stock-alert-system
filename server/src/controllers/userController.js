const { User, StockMovement } = require('../models');
const { toSafeUser } = require('./authController');

async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ users: users.map(toSafeUser) });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'staff', phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    if (!['admin', 'manager', 'staff'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (await User.findOne({ where: { email } })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password_hash: password, role, phone: phone?.trim() || null });
    res.status(201).json({ user: toSafeUser(user) });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, email, role, phone, is_active, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    if (role && !['admin', 'manager', 'staff'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== user.id) return res.status(409).json({ error: 'Email already registered' });
    if (user.id === req.user.id && is_active === false) return res.status(400).json({ error: 'You cannot disable your own account' });
    Object.assign(user, { name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null });
    if (role) user.role = role;
    if (typeof is_active === 'boolean') user.is_active = is_active;
    if (password) user.password_hash = password;
    await user.save();
    res.json({ user: toSafeUser(user) });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    if (user.role === 'admin' && user.is_active) {
      const activeAdmins = await User.count({ where: { role: 'admin', is_active: true } });
      if (activeAdmins <= 1) return res.status(400).json({ error: 'You cannot delete the last active administrator' });
    }
    // Keep the stock audit trail, removing only its reference to this account.
    await StockMovement.update({ performed_by: null }, { where: { performed_by: user.id } });
    await user.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
