'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

export default function ProductsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', sku: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '0', unit: 'pcs', minStock: '5', image: '', active: true });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status]);

  async function loadData() {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories?type=PRODUCT'),
    ]);
    const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()]);
    setProducts(Array.isArray(prods) ? prods : []);
    setCategories(Array.isArray(cats) ? cats : []);
    setLoading(false);
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !filterCat || p.categoryId === parseInt(filterCat);
    return matchSearch && matchCat;
  });

  function openAddModal() {
    setForm({ name: '', sku: '', categoryId: categories[0]?.id || '', buyPrice: '', sellPrice: '', stock: '0', unit: 'pcs', minStock: '5', image: '', active: true });
    setError('');
    setModal({ open: true, mode: 'add', data: null });
  }

  function openEditModal(product) {
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      unit: product.unit,
      minStock: product.minStock,
      image: product.image || '',
      active: product.active,
    });
    setError('');
    setModal({ open: true, mode: 'edit', data: product });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = modal.mode === 'add' ? '/api/products' : `/api/products/${modal.data.id}`;
      const method = modal.mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setModal({ open: false, mode: 'add', data: null });
      loadData();
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.product) return;
    try {
      await fetch(`/api/products/${deleteModal.product.id}`, { method: 'DELETE' });
      setDeleteModal({ open: false, product: null });
      loadData();
    } catch {}
  }

  return (
    <AppShell pageTitle="Produk">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Produk</h1>
          <p className="page-subtitle">Kelola inventori produk Anda</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" className="form-control form-control-sm" placeholder="Cari nama atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control form-control-sm" style={{ minWidth: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Harga Beli</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <Package size={32} className="empty-state-icon" />
                      <p className="empty-state-text">Tidak ada produk ditemukan</p>
                    </div>
                  </td></tr>
                ) : filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="product-img-placeholder" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.image ? <img src={p.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} /> : <Package size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{p.sku}</span></td>
                    <td>{p.category?.name || '-'}</td>
                    <td>{formatCurrency(p.buyPrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.sellPrice)}</td>
                    <td>
                      <span className={`badge ${p.stock <= p.minStock ? 'badge-danger' : 'badge-success'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td><span className={`badge ${p.active ? 'badge-success' : 'badge-secondary'}`}>{p.active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(p)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteModal({ open: true, product: p })} title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'add' ? 'Tambah Produk' : 'Edit Produk'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nama Produk *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-control" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select className="form-control" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Satuan</label>
                <input className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, liter..." />
              </div>
              <div className="form-group">
                <label className="form-label">Harga Beli</label>
                <input type="number" className="form-control" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Harga Jual *</label>
                <input type="number" className="form-control" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} min="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Stok Awal</label>
                <input type="number" className="form-control" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Stok Minimum</label>
                <input type="number" className="form-control" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">URL Gambar (opsional)</label>
              <input className="form-control" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            {modal.mode === 'edit' && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="activeCheck" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                <label htmlFor="activeCheck" className="form-label" style={{ margin: 0 }}>Produk Aktif</label>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ ...modal, open: false })}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, product: null })} title="Hapus Produk">
        <div className="modal-body">
          <p>Apakah Anda yakin ingin menghapus produk <strong>{deleteModal.product?.name}</strong>?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, product: null })}>Batal</button>
          <button className="btn btn-danger" onClick={handleDelete}>Hapus</button>
        </div>
      </Modal>
    </AppShell>
  );
}
