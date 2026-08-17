const { User } = require('../models');

function normalizeNigerianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 13) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('8')) return `234${digits}`;
  return null;
}

async function sendEmail(recipients, subject, message) {
  if (process.env.EMAIL_ENABLED !== 'true' || !recipients.length) return;
  let nodemailer;
  try { nodemailer = require('nodemailer'); }
  catch { throw new Error('Nodemailer is not installed. Run npm install in the server folder.'); }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to: recipients.join(','), subject, text: message });
}

async function sendSms(recipients, message) {
  if (process.env.SMS_ENABLED !== 'true' || !recipients.length) return;
  const baseUrl = process.env.NIGERIA_BULK_SMS_URL || 'https://portal.nigeriabulksms.com/api/';
  const params = new URLSearchParams({ username: process.env.NIGERIA_BULK_SMS_USERNAME || '', password: process.env.NIGERIA_BULK_SMS_PASSWORD || '', sender: process.env.NIGERIA_BULK_SMS_SENDER || 'StockWatch', mobiles: recipients.join(','), message });
  const response = await fetch(`${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params}`);
  const payload = await response.text();
  if (!response.ok || /"error"|"status"\s*:\s*"?(?!OK)/i.test(payload)) throw new Error(`NigeriaBulkSMS rejected the SMS: ${payload}`);
}

async function deliverAlert({ type, message }) {
  const users = await User.findAll({ where: { is_active: true }, attributes: ['email', 'phone'] });
  const emails = users.map((user) => user.email).filter(Boolean);
  const phones = [...new Set(users.map((user) => normalizeNigerianPhone(user.phone)).filter(Boolean))];
  const subject = `StockWatch: ${type.replace(/_/g, ' ')}`;
  const results = await Promise.allSettled([sendEmail(emails, subject, message), sendSms(phones, message)]);
  results.forEach((result, index) => { if (result.status === 'rejected') console.error(`[notification] ${index === 0 ? 'email' : 'SMS'} delivery failed:`, result.reason.message); });
}

module.exports = { deliverAlert, normalizeNigerianPhone };
