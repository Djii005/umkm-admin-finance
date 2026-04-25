'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
}
function formatDate(d) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}
function toInputDate(d) {
  return new Date(d).toISOString().split('T')[0];
}

export default function FinancesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('INCOME');
  const [finances, setFinances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'INCOME',
    categoryId: '',
    amount: '',
    description: '',
    date: toInputDate(new Date()),
    paymentMethod: 'Tunai',
  });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
      loadCategories();
    }
  }, [status, tab]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/finances?type=${tab}`);
      const data = await res.json();
      setFinances(Array.isArray(data) ? data : []);
    } catch {
      setFinances([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(`/api/categories?type=${tab}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }

  function openAddModal() {
    setForm({ type: tab, categoryId: '', amount: '', description: '', date: toInputDate(new Date()), paymentMethod: 'Tunai' });
    setError('');
    setModal({ open: true, mode: 'add', data: null });
  }

  function openEditModal(item) {
    setForm({
      type: item.type,
      categoryId: item.categoryId || '',
      amount: item.amount,
      description: item.description || '',
      date: toInputDate(item.date),
      paymentMethod: item.paymentMethod || 'Tunai',
    });
    setError('');
    setModal({ open: true, mode: 'edit', data: item });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = modal.mode === 'add' ? '/api/finances' : `/api/finances/${modal.data.id}`;
      const method = modal.mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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
    if (!deleteModal.item) return;
    try {
      await fetch(`/api/finances/${deleteModal.item.id}`, { method: 'DELETE' });
      setDeleteModal({ open: false, item: null });
      loadData();
    } catch {}
  }

  const totalAmount = finances.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <AppShell pageTitle="Keuangan">
      <div className="page-header">
        <div>
          <h1 className="page-title">Keuangan</h1>
          <p className="page-subtitle">Manajemen pemasukan dan pengeluaran</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Entri
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'INCOME' ? 'active' : ''}`} onClick={() => setTab('INCOME')}>
          <TrendingUp size={14} /> Pemasukan
        </button>
        <button className={`tab ${tab === 'EXPENSE' ? 'active' : ''}`} onClick={() => setTab('EXPENSE')}>
          <TrendingDown size={14} /> Pengeluaran
        </button>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total {tab === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</span>
            <div className={`stat-card-icon ${tab === 'INCOME' ? 'green' : 'red'}`}>
              {tab === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="stat-card-value" style={{ color: tab === 'INCOME' ? '#34d399' : '#f87171', fontSize: 18 }}>
            {formatCurrency(totalAmount)}
          </div>
          <div className="stat-card-trend">{finances.length} entri</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Metode</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {finances.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      {tab === 'INCOME' ? <TrendingUp size={32} className="empty-state-icon" /> : <TrendingDown size={32} className="empty-state-icon" />}
                      <p className="empty-state-text">Belum ada data {tab === 'INCOME' ? 'pemasukan' : 'pengeluaran'}</p>
                    </div>
                  </td></tr>
                ) : finances.map(f => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(f.date)}</td>
                    <td>{f.description || '-'}</td>
                    <td>{f.category?.name || '-'}</td>
                    <td><span className="badge badge-secondary">{f.paymentMethod || '-'}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: tab === 'INCOME' ? '#34d399' : '#f87171', fontSize: 14 }}>
                        {tab === 'INCOME' ? '+' : '-'} {formatCurrency(f.amount)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(f)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteModal({ open: true, item: f })} title="Hapus"><Trash2 size={14} /></button>
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
      <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'add' ? `Tambah ${tab === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}` : 'Edit Entri'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label className="form-label">Tanggal *</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Jumlah *</label>
              <input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0" required placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-control" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <select className="form-control" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Kartu">Kartu Debit/Kredit</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Keterangan tambahan..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ ...modal, open: false })}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} title="Hapus Entri">
        <div className="modal-body">
          <p>Apakah Anda yakin ingin menghapus entri <strong>{deleteModal.item?.description || 'ini'}</strong>?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, item: null })}>Batal</button>
          <button className="btn btn-danger" onClick={handleDelete}>Hapus</button>
        </div>
      </Modal>
    </AppShell>
  );
}
