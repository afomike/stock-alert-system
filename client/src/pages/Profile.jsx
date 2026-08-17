import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', password: '' });
  const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(e) { e.preventDefault(); setSaving(true); setMessage(''); try { await updateProfile(form); setForm((f) => ({ ...f, password: '' })); setMessage('Profile saved.'); } catch (err) { setMessage(err.response?.data?.error || 'Could not save profile.'); } finally { setSaving(false); } }
  return <Layout title="My Profile"><form onSubmit={submit} className="max-w-xl bg-white border border-line p-6 flex flex-col gap-4"><p className="text-sm text-ink/60">Add your Nigerian phone number to receive SMS alerts. Use 080… or +234… format.</p>{message && <p className="text-sm text-slate">{message}</p>}<input required placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} className="border border-line p-3" /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} className="border border-line p-3" /><input placeholder="Phone number" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="border border-line p-3" /><input type="password" placeholder="New password (leave blank to keep current)" value={form.password} onChange={(e) => update('password', e.target.value)} className="border border-line p-3" /><button disabled={saving} className="bg-ink text-paper p-3 font-mono text-xs uppercase tracking-widest disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button></form></Layout>;
}
