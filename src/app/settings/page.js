'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import { Save, Building2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    logo: '',
    taxId: '',
    taxRate: '0',
  });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadSettings();
  }, [status]);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setForm({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          logo: data.logo || '',
          taxId: data.taxId || '',
          taxRate: data.taxRate != null ? String(data.taxRate) : '0',
        });
      }
    } catch {
      setError('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell pageTitle="Pengaturan">
        <div className="loading-container"><span className="spinner" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Pengaturan">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi profil bisnis Anda</p>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} />
            Pengaturan berhasil disimpan!
          </div>
        )}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>
        )}

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(37, 99, 235, 0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="var(--blue-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Profil Bisnis</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Informasi yang tampil di invoice dan laporan</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Bisnis *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Nama toko atau perusahaan Anda"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat lengkap bisnis"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">No. Telepon</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="form-group">
                <label className="form-label">NPWP / Tax ID</label>
                <input
                  className="form-control"
                  value={form.taxId}
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                  placeholder="Nomor NPWP"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tarif Pajak Default (%)</label>
              <input
                type="number"
                className="form-control"
                value={form.taxRate}
                onChange={e => setForm({ ...form, taxRate: e.target.value })}
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                style={{ maxWidth: 200 }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Nilai 0 berarti tidak ada pajak. Contoh: 11 untuk PPN 11%.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">URL Logo (opsional)</label>
              <input
                className="form-control"
                value={form.logo}
                onChange={e => setForm({ ...form, logo: e.target.value })}
                placeholder="https://... (URL gambar logo)"
              />
              {form.logo && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={form.logo}
                    alt="Logo Preview"
                    style={{ height: 60, objectFit: 'contain', borderRadius: 6, background: 'var(--bg-tertiary)', padding: 4 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
              {saving ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan...</>
              ) : (
                <><Save size={16} /> Simpan Pengaturan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
