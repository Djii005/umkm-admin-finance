'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Printer, CheckCircle, Check } from 'lucide-react';
import { generateInvoicePDF } from '@/components/InvoicePDF';
import Link from 'next/link';

export default function TransactionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('SALE');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, transaction: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, transaction: null });
  const [business, setBusiness] = useState(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
      loadBusiness();
    }
  }, [status, tab]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?type=${tab}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadBusiness() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setBusiness(data);
    } catch {}
  }

  async function viewDetail(id) {
    try {
      const res = await fetch(`/api/transactions/${id}`);
      const data = await res.json();
      setDetailModal({ open: true, transaction: data });
    } catch {}
  }

  function openConfirmModal(transaction) {
    setConfirmModal({ open: true, transaction });
  }

  async function handleConfirmSelesaikan() {
    if (!confirmModal.transaction) return;
    const tx = confirmModal.transaction;
    setUpdatingId(tx.id);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Gagal menyelesaikan transaksi');
        return;
      }
      setConfirmModal({ open: false, transaction: null });
      await loadData();
      if (detailModal.open && detailModal.transaction?.id === tx.id) {
        setDetailModal(prev => ({
          ...prev,
          transaction: { ...prev.transaction, paymentStatus: 'PAID' },
        }));
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AppShell pageTitle="Transaksi">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi</h1>
          <p className="page-subtitle">Riwayat penjualan dan pembelian</p>
        </div>
        <Link href="/transactions/new" className="btn btn-primary">
          <Plus size={16} /> Transaksi Baru
        </Link>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'SALE' ? 'active' : ''}`} onClick={() => setTab('SALE')}>Penjualan</button>
        <button className={`tab ${tab === 'PURCHASE' ? 'active' : ''}`} onClick={() => setTab('PURCHASE')}>Pembelian</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No Invoice</th>
                  <th>Tanggal</th>
                  <th>{tab === 'SALE' ? 'Pelanggan' : 'Supplier'}</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <p className="empty-state-text">Belum ada transaksi</p>
                    </div>
                  </td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-400)' }}>{t.invoiceNo}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.date)}</td>
                    <td>{tab === 'SALE' ? (t.customer?.name || 'Walk-in') : (t.supplier?.name || '-')}</td>
                    <td>{formatCurrency(t.subtotal)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.total)}</td>
                    <td>
                      <span
                        className={`badge ${t.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => viewDetail(t.id)} title="Detail"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => generateInvoicePDF({ ...t, items: t.items || [] }, business)} title="Cetak"><Printer size={14} /></button>
                        {t.paymentStatus !== 'PAID' ? (
                          <button
                            className="btn btn-sm btn-success"
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => openConfirmModal(t)}
                            disabled={updatingId === t.id}
                            title="Selesaikan Transaksi"
                          >
                            <Check size={13} /> Selesaikan
                          </button>
                        ) : (
                          <span
                            style={{
                              color: '#10b981',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '3px 8px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            <Check size={12} /> LUNAS
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => !updatingId && setConfirmModal({ open: false, transaction: null })}
        title="Konfirmasi Pelunasan Transaksi"
      >
        {confirmModal.transaction && (
          <>
            <div className="modal-body" style={{ textAlign: 'center', padding: '16px 8px 24px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle size={30} />
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                Selesaikan Transaksi Ini?
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                Transaksi <strong style={{ color: 'var(--blue-400)', fontFamily: 'monospace' }}>{confirmModal.transaction.invoiceNo}</strong> sebesar{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(confirmModal.transaction.total)}</strong> akan ditandai sebagai <strong style={{ color: '#10b981' }}>LUNAS</strong> dan otomatis tercatat ke laporan <strong>Keuangan</strong>.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, transaction: null })}
                disabled={Boolean(updatingId)}
              >
                Batal
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmSelesaikan}
                disabled={Boolean(updatingId)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 130, justifyContent: 'center' }}
              >
                <Check size={16} /> {updatingId ? 'Memproses...' : 'Ya, Selesaikan'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, transaction: null })}
        title={`Detail Transaksi — ${detailModal.transaction?.invoiceNo || ''}`}
        size="lg"
      >
        {detailModal.transaction && (
          <>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tanggal</p>
                  <p style={{ fontWeight: 500 }}>{formatDate(detailModal.transaction.date)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</p>
                  <span className={`badge ${detailModal.transaction.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {detailModal.transaction.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
                {detailModal.transaction.customer && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pelanggan</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.customer.name}</p>
                  </div>
                )}
                {detailModal.transaction.supplier && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.supplier.name}</p>
                  </div>
                )}
                {detailModal.transaction.paymentMethod && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Metode Pembayaran</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.paymentMethod}</p>
                  </div>
                )}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {(detailModal.transaction.items || []).map(item => (
                      <tr key={item.id}>
                        <td>{item.product?.name || '-'}</td>
                        <td>{item.qty} {item.product?.unit}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(detailModal.transaction.subtotal)}</span></div>
                {detailModal.transaction.discount > 0 && (
                  <div className="summary-row"><span>Diskon</span><span>- {formatCurrency(detailModal.transaction.discount)}</span></div>
                )}
                {detailModal.transaction.tax > 0 && (
                  <div className="summary-row"><span>Pajak</span><span>{formatCurrency(detailModal.transaction.tax)}</span></div>
                )}
                <div className="summary-row total"><span>Total</span><span>{formatCurrency(detailModal.transaction.total)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModal({ open: false, transaction: null })}>Tutup</button>
              {detailModal.transaction.paymentStatus !== 'PAID' && (
                <button
                  className="btn btn-success"
                  onClick={() => openConfirmModal(detailModal.transaction)}
                  disabled={Boolean(updatingId)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} /> Selesaikan Transaksi (Lunas)
                </button>
              )}
              <button className="btn btn-primary" onClick={() => generateInvoicePDF(detailModal.transaction, business)}>
                <Printer size={14} /> Cetak Invoice
              </button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
