'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';

export default function SuppliersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, supplier: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '' });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search)) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  function openAddModal() {
    setForm({ name: '', phone: '', address: '', email: '' });
    setError('');
    setModal({ open: true, mode: 'add', data: null });
  }

  function openEditModal(supplier) {
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
      email: supplier.email || '',
    });
    setError('');
    setModal({ open: true, mode: 'edit', data: supplier });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = modal.mode === 'add' ? '/api/suppliers' : `/api/suppliers/${modal.data.id}`;
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
    if (!deleteModal.supplier) return;
    try {
      await fetch(`/api/suppliers/${deleteModal.supplier.id}`, { method: 'DELETE' });
      setDeleteModal({ open: false, supplier: null });
      loadData();
    } catch {}
  }

  return (
    <AppShell pageTitle="Pemasok">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pemasok</h1>
          <p className="page-subtitle">Kelola data supplier dan pemasok</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Pemasok
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" className="form-control form-control-sm" placeholder="Cari nama, HP, atau email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filteredSuppliers.length} pemasok</span>
        </div>

        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No. HP</th>
                  <th>Email</th>
                  <th>Alamat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <Truck size={32} className="empty-state-icon" />
                      <p className="empty-state-text">Tidak ada pemasok ditemukan</p>
                    </div>
                  </td></tr>
                ) : filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Truck size={16} color="var(--blue-400)" />
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.phone || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.email || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(s)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteModal({ open: true, supplier: s })} title="Hapus"><Trash2 size={14} /></button>
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
      <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'add' ? 'Tambah Pemasok' : 'Edit Pemasok'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nama Pemasok *</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nama pemasok atau perusahaan" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">No. HP</label>
                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ ...modal, open: false })}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, supplier: null })} title="Hapus Pemasok">
        <div className="modal-body">
          <p>Apakah Anda yakin ingin menghapus pemasok <strong>{deleteModal.supplier?.name}</strong>?</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, supplier: null })}>Batal</button>
          <button className="btn btn-danger" onClick={handleDelete}>Hapus</button>
        </div>
      </Modal>
    </AppShell>
  );
}
