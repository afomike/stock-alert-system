const jwt = require('jsonwebtoken');
const { User } = require('../models');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    is_active: user.is_active,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // password gets hashed automatically by the User model's beforeCreate hook
    const user = await User.create({
      name,
      email,
      password_hash: password,
      role: role || 'staff',
      phone,
    });

    const token = signToken(user);
    res.status(201).json({ user: toSafeUser(user), token });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    req.user.name = name.trim();
    req.user.email = email.trim().toLowerCase();
    req.user.phone = phone?.trim() || null;
    if (password) req.user.password_hash = password;
    await req.user.save();
    res.json({ user: toSafeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const token = signToken(user);
    res.json({ user: toSafeUser(user), token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: toSafeUser(req.user) });
}

async function logout(req, res) {
  // Stateless JWT: logout is handled client-side by discarding the token.
  // Included as a named endpoint to match the spec / for future token-blacklisting.
  res.json({ message: 'Logged out successfully' });
}

module.exports = { register, login, me, updateProfile, logout, toSafeUser };
