import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StockTable from '../components/StockTable';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import * as productService from '../services/productService';
import * as inventoryService from '../services/inventoryService';
import * as supplierService from '../services/supplierService';

const STATUS_FILTERS = ['ALL', 'IN_STOCK', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK'];
const PAGE_SIZE = 9;

const EMPTY_PRODUCT_FORM = {
  name: '',
  sku: '',
  category: '',
  cost_price: '',
  selling_price: '',
  current_stock: '',
  minimum_stock: '',
  maximum_stock: '',
  reorder_quantity: '',
  safety_stock: '',
  supplier_id: '',
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState('table');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState(null);
  const [movementQty, setMovementQty] = useState('');
  const [movementType, setMovementType] = useState('RESTOCK');
  const [savingMovement, setSavingMovement] = useState(false);

  const [modalTab, setModalTab] = useState('movement'); // 'movement' | 'edit'
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_PRODUCT_FORM);
  const [savingCreate, setSavingCreate] = useState(false);

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the filters change, so a narrower search doesn't
  // strand the view on a page number that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [productsData, suppliersData] = await Promise.all([
        productService.getProducts(params),
        supplierService.getSuppliers({ limit: 100 }).catch(() => ({ suppliers: [] })),
      ]);
      setProducts(productsData.products);
      setTotalPages(productsData.totalPages);
      setTotalCount(productsData.totalCount);
      setSuppliers(suppliersData.suppliers);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load products. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter]);

  function openProduct(product) {
    setSelected(product);
    setModalTab('movement');
    setEditForm({
      name: product.name,
      sku: product.sku,
      category: product.category || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      minimum_stock: product.minimum_stock,
      maximum_stock: product.maximum_stock,
      reorder_quantity: product.reorder_quantity,
      safety_stock: product.safety_stock,
      supplier_id: product.supplier_id || '',
    });
  }

  async function handleRecordMovement(e) {
    e.preventDefault();
    if (!selected || !movementQty) return;
    setSavingMovement(true);
    try {
      const qty = Number(movementQty);
      const signedQty = movementType === 'SALE' || movementType === 'DAMAGED' ? -Math.abs(qty) : Math.abs(qty);
      await inventoryService.recordMovement({
        productId: selected.id,
        type: movementType,
        quantityChange: signedQty,
      });
      setSelected(null);
      setMovementQty('');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not record movement');
    } finally {
      setSavingMovement(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        cost_price: Number(editForm.cost_price) || 0,
        selling_price: Number(editForm.selling_price) || 0,
        current_stock: Number(editForm.current_stock) || 0,
        minimum_stock: Number(editForm.minimum_stock) || 0,
        maximum_stock: Number(editForm.maximum_stock) || 0,
        reorder_quantity: Number(editForm.reorder_quantity) || 0,
        safety_stock: Number(editForm.safety_stock) || 0,
        supplier_id: editForm.supplier_id || null,
      };
      await productService.updateProduct(selected.id, payload);
      setSelected(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update product');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!selected || !confirm(`Delete ${selected.name}? This cannot be undone.`)) return;
    try {
      await productService.deleteProduct(selected.id);
      setSelected(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete product');
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSavingCreate(true);
    try {
      const payload = {
        ...createForm,
        cost_price: Number(createForm.cost_price) || 0,
        selling_price: Number(createForm.selling_price) || 0,
        current_stock: Number(createForm.current_stock) || 0,
        minimum_stock: Number(createForm.minimum_stock) || 10,
        maximum_stock: Number(createForm.maximum_stock) || 100,
        reorder_quantity: Number(createForm.reorder_quantity) || 50,
        safety_stock: Number(createForm.safety_stock) || 0,
        supplier_id: createForm.supplier_id || null,
      };
      await productService.createProduct(payload);
      setCreateForm(EMPTY_PRODUCT_FORM);
      setShowCreateForm(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create product');
    } finally {
      setSavingCreate(false);
    }
  }

  function fieldInput(value, onChange, props = {}) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line bg-white px-3 py-2 text-sm w-full"
        {...props}
      />
    );
  }

  return (
    <Layout title="Inventory">
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Error Loading Inventory</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="mb-6 space-y-4">
        <div className="card p-5">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or SKU…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64 px-4 py-2.5 text-base border border-line bg-white text-ink rounded-lg placeholder-ink/30 focus:border-slate focus:ring-2 focus:ring-slate/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-base border border-line bg-white text-ink rounded-lg font-medium focus:border-slate focus:ring-2 focus:ring-slate/20"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle & Add Button */}
            <div className="flex gap-3 items-center">
              <div className="inline-flex border border-line rounded-lg overflow-hidden">
                <button
                  onClick={() => setView('table')}
                  className={`px-4 py-2.5 font-medium text-sm transition-all ${view === 'table' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                  title="Table view"
                >
                  📊 Table
                </button>
                <div className="w-px bg-line"></div>
                <button
                  onClick={() => setView('grid')}
                  className={`px-4 py-2.5 font-medium text-sm transition-all ${view === 'grid' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                  title="Grid view"
                >
                  🔲 Grid
                </button>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary btn-md"
              >
                <span>+</span> New Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-line border-t-slate rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-ink/50 font-medium">Loading inventory…</p>
          <p className="text-sm text-ink/40 mt-1">Please wait while we fetch your products</p>
        </div>
      ) : (
        <>
          {view === 'table' ? (
            <StockTable products={products} onRowClick={openProduct} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onClick={openProduct} />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50 overflow-y-auto py-8"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-paper w-full max-w-md p-6 status-rail"
            style={{ borderLeftColor: '#4A5B7A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl text-ink">{selected.name}</p>
            <p className="font-mono text-xs text-ink/50 mb-4">{selected.sku}</p>

            <div className="flex border border-line font-mono text-[0.68rem] uppercase tracking-widest mb-4 w-fit">
              <button
                onClick={() => setModalTab('movement')}
                className={`px-3 py-1.5 ${modalTab === 'movement' ? 'bg-ink text-paper' : 'text-ink/60'}`}
              >
                Record Movement
              </button>
              <button
                onClick={() => setModalTab('edit')}
                className={`px-3 py-1.5 ${modalTab === 'edit' ? 'bg-ink text-paper' : 'text-ink/60'}`}
              >
                Edit Product
              </button>
            </div>

            {modalTab === 'movement' ? (
              <form onSubmit={handleRecordMovement} className="flex flex-col gap-3">
                <p className="text-sm text-ink/70">
                  Current stock: <span className="font-mono">{selected.current_stock}</span>
                </p>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="RESTOCK">Restock</option>
                  <option value="STOCK_IN">Stock in</option>
                  <option value="SALE">Sale</option>
                  <option value="STOCK_OUT">Stock out</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="RETURN">Return</option>
                </select>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Quantity"
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="border border-line bg-white px-3 py-2 text-sm"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={savingMovement}
                    className="flex-1 bg-ink text-paper font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-50"
                  >
                    {savingMovement ? 'Saving…' : 'Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex-1 border border-line font-mono text-xs uppercase tracking-widest py-2.5 text-ink/70 hover:border-ink"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Name
                    </label>
                    {fieldInput(editForm.name, (v) => setEditForm((f) => ({ ...f, name: v })), { required: true })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      SKU
                    </label>
                    {fieldInput(editForm.sku, (v) => setEditForm((f) => ({ ...f, sku: v })), { required: true })}
                  </div>
                  <div className="col-span-2">
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Category
                    </label>
                    {fieldInput(editForm.category, (v) => setEditForm((f) => ({ ...f, category: v })))}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Cost price
                    </label>
                    {fieldInput(editForm.cost_price, (v) => setEditForm((f) => ({ ...f, cost_price: v })), {
                      type: 'number',
                      step: '0.01',
                    })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Selling price
                    </label>
                    {fieldInput(editForm.selling_price, (v) => setEditForm((f) => ({ ...f, selling_price: v })), {
                      type: 'number',
                      step: '0.01',
                    })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Current stock
                    </label>
                    {fieldInput(editForm.current_stock, (v) => setEditForm((f) => ({ ...f, current_stock: v })), {
                      type: 'number',
                    })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Minimum stock
                    </label>
                    {fieldInput(editForm.minimum_stock, (v) => setEditForm((f) => ({ ...f, minimum_stock: v })), {
                      type: 'number',
                    })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Maximum stock
                    </label>
                    {fieldInput(editForm.maximum_stock, (v) => setEditForm((f) => ({ ...f, maximum_stock: v })), {
                      type: 'number',
                    })}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Reorder qty
                    </label>
                    {fieldInput(
                      editForm.reorder_quantity,
                      (v) => setEditForm((f) => ({ ...f, reorder_quantity: v })),
                      { type: 'number' }
                    )}
                  </div>
                  <div>
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Safety stock
                    </label>
                    {fieldInput(editForm.safety_stock, (v) => setEditForm((f) => ({ ...f, safety_stock: v })), {
                      type: 'number',
                    })}
                  </div>
                  <div className="col-span-2">
                    <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                      Supplier
                    </label>
                    <select
                      value={editForm.supplier_id}
                      onChange={(e) => setEditForm((f) => ({ ...f, supplier_id: e.target.value }))}
                      className="border border-line bg-white px-3 py-2 text-sm w-full"
                    >
                      <option value="">None</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 bg-ink text-paper font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="border border-brick text-brick font-mono text-xs uppercase tracking-widest px-3 py-2.5 hover:bg-brick/10"
                  >
                    Delete
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div
          className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50 overflow-y-auto py-8"
          onClick={() => setShowCreateForm(false)}
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-paper w-full max-w-md p-6 status-rail"
            style={{ borderLeftColor: '#4A5B7A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl text-ink mb-4">New Product</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Name
                </label>
                {fieldInput(createForm.name, (v) => setCreateForm((f) => ({ ...f, name: v })), { required: true })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  SKU
                </label>
                {fieldInput(createForm.sku, (v) => setCreateForm((f) => ({ ...f, sku: v })), { required: true })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Category
                </label>
                {fieldInput(createForm.category, (v) => setCreateForm((f) => ({ ...f, category: v })))}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Cost price
                </label>
                {fieldInput(createForm.cost_price, (v) => setCreateForm((f) => ({ ...f, cost_price: v })), {
                  type: 'number',
                  step: '0.01',
                })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Selling price
                </label>
                {fieldInput(createForm.selling_price, (v) => setCreateForm((f) => ({ ...f, selling_price: v })), {
                  type: 'number',
                  step: '0.01',
                })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Starting stock
                </label>
                {fieldInput(createForm.current_stock, (v) => setCreateForm((f) => ({ ...f, current_stock: v })), {
                  type: 'number',
                })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Minimum stock
                </label>
                {fieldInput(createForm.minimum_stock, (v) => setCreateForm((f) => ({ ...f, minimum_stock: v })), {
                  type: 'number',
                })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Maximum stock
                </label>
                {fieldInput(createForm.maximum_stock, (v) => setCreateForm((f) => ({ ...f, maximum_stock: v })), {
                  type: 'number',
                })}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Reorder qty
                </label>
                {fieldInput(
                  createForm.reorder_quantity,
                  (v) => setCreateForm((f) => ({ ...f, reorder_quantity: v })),
                  { type: 'number' }
                )}
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Safety stock
                </label>
                {fieldInput(createForm.safety_stock, (v) => setCreateForm((f) => ({ ...f, safety_stock: v })), {
                  type: 'number',
                })}
              </div>
              <div className="col-span-2">
                <label className="font-mono text-[0.65rem] uppercase tracking-widest text-ink/50 block mb-1">
                  Supplier
                </label>
                <select
                  value={createForm.supplier_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, supplier_id: e.target.value }))}
                  className="border border-line bg-white px-3 py-2 text-sm w-full"
                >
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={savingCreate}
                className="flex-1 bg-ink text-paper font-mono text-xs uppercase tracking-widest py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-50"
              >
                {savingCreate ? 'Creating…' : 'Create product'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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
