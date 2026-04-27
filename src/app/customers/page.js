'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function CustomersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, customer: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  function openAddModal() {
    setForm({ name: '', phone: '', address: '' });
    setError('');
    setModal({ open: true, mode: 'add', data: null });
  }

  function openEditModal(customer) {
    setForm({ name: customer.name, phone: customer.phone || '', address: customer.address || '' });
    setError('');
    setModal({ open: true, mode: 'edit', data: customer });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = modal.mode === 'add' ? '/api/customers' : `/api/customers/${modal.data.id}`;
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
    if (!deleteModal.customer) return;
    try {
      await fetch(`/api/customers/${deleteModal.customer.id}`, { method: 'DELETE' });
      setDeleteModal({ open: false, customer: null });
      loadData();
    } catch {}
  }

  return (
    <AppShell pageTitle="Pelanggan">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pelanggan</h1>
          <p className="page-subtitle">Kelola data pelanggan Anda</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Pelanggan
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" className="form-control form-control-sm" placeholder="Cari nama atau nomor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filteredCustomers.length} pelanggan</span>
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
                  <th>Alamat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan={4}>
                    <div className="empty-state">
                      <Users size={32} className="empty-state-icon" />
                      <p className="empty-state-text">Tidak ada pelanggan ditemukan</p>
                    </div>
                  </td></tr>
                ) : filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(c)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteModal({ open: true, customer: c })} title="Hapus"><Trash2 size={14} /></button>
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
      <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'add' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nama *</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nama lengkap pelanggan" />
            </div>
            <div className="form-group">
              <label className="form-label">No. HP</label>
              <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
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
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, customer: null })} title="Hapus Pelanggan">
        <div className="modal-body">
          <p>Apakah Anda yakin ingin menghapus pelanggan <strong>{deleteModal.customer?.name}</strong>?</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, customer: null })}>Batal</button>
          <button className="btn btn-danger" onClick={handleDelete}>Hapus</button>
        </div>
      </Modal>
    </AppShell>
  );
}
