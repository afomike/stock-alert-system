import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import * as supplierService from '../services/supplierService';

const EMPTY_FORM = { name: '', contact_person: '', email: '', phone: '', address: '', average_lead_time_days: 5 };
const PAGE_SIZE = 9;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await supplierService.getSuppliers(params);
      setSuppliers(data.suppliers);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load suppliers. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormMode('create');
  }

  function openEdit(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      average_lead_time_days: supplier.average_lead_time_days,
    });
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, average_lead_time_days: Number(form.average_lead_time_days) || 5 };
    try {
      if (formMode === 'edit') {
        await supplierService.updateSupplier(editingId, payload);
      } else {
        await supplierService.createSupplier(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not save supplier');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    if (!confirm(`Delete ${supplier.name}? Linked products will keep their data but lose this supplier link.`)) return;
    try {
      await supplierService.deleteSupplier(supplier.id);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete supplier');
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Layout title="Suppliers">
      {error && (
        <div className="mb-6 border border-brick/30 bg-brick/10 text-brick px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search suppliers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm w-56 focus:outline-none focus-visible:outline-2 focus-visible:outline-slate"
        />
        <button
          onClick={openCreate}
          className="bg-ink text-paper font-mono text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-ink-soft transition-colors"
        >
          + New Supplier
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-widest text-ink/40">Loading manifest…</p>
      ) : suppliers.length === 0 ? (
        <div className="border border-line bg-white p-8 text-center">
          <p className="font-display text-lg text-ink/70">No suppliers found</p>
          <p className="text-sm text-ink/50 mt-1">
            {debouncedSearch ? 'Try a different search.' : 'Add a supplier to start linking products to lead times.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="status-rail bg-white p-4" style={{ borderLeftColor: '#4A5B7A' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{s.name}</p>
                    {s.contact_person && <p className="text-sm text-ink/60 mt-0.5">{s.contact_person}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="font-mono text-[0.65rem] uppercase tracking-widest text-slate hover:text-ink border border-line px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="font-mono text-[0.65rem] uppercase tracking-widest text-brick hover:bg-brick/10 border border-brick/30 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1 text-xs text-ink/70 font-mono">
                  {s.email && <p>{s.email}</p>}
                  {s.phone && <p>{s.phone}</p>}
                  {s.address && <p className="text-ink/50">{s.address}</p>}
                </div>
                <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                  <span className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/40">
                    Lead time
                  </span>
                  <span className="font-mono text-sm text-ink">{s.average_lead_time_days} days</span>
                </div>
                {s.products?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-line">
                    <span className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/40">
                      {s.products.length} product{s.products.length !== 1 ? 's' : ''} supplied
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}

      {formMode && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50" onClick={closeForm}>
          <form
            onSubmit={handleSubmit}
            className="bg-paper w-full max-w-sm p-6 status-rail flex flex-col gap-3"
            style={{ borderLeftColor: '#4A5B7A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl text-ink mb-1">
              {formMode === 'edit' ? 'Edit Supplier' : 'New Supplier'}
            </p>

            <input
              required
              placeholder="Supplier name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              placeholder="Contact person"
              value={form.contact_person}
              onChange={(e) => updateField('contact_person', e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              placeholder="Address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            />
            <div>
              <label className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/50 block mb-1.5">
                Average lead time (days)
              </label>
              <input
                type="number"
                min="1"
                value={form.average_lead_time_days}
                onChange={(e) => updateField('average_lead_time_days', e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm w-full"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-ink text-paper font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : formMode === 'edit' ? 'Save changes' : 'Create'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 border border-line font-mono text-xs uppercase tracking-widest py-2.5 text-ink/70 hover:border-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
