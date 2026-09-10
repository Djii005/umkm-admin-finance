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
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, transaction: null });
  const [business, setBusiness] = useState(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      setSelectedIds([]);
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

  const unpaidList = transactions.filter(t => t.paymentStatus !== 'PAID');
  const isAllUnpaidSelected = unpaidList.length > 0 && unpaidList.every(t => selectedIds.includes(t.id));

  function handleSelectAll() {
    if (isAllUnpaidSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaidList.map(t => t.id));
    }
  }

  function handleToggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleBatchMarkPaid() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Selesaikan ${selectedIds.length} transaksi yang dipilih (tandai LUNAS)?`)) return;
    setBatchUpdating(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentStatus: 'PAID' }),
          })
        )
      );
      setSelectedIds([]);
      await loadData();
    } catch {
      alert('Terjadi kesalahan saat memproses transaksi');
    } finally {
      setBatchUpdating(false);
    }
  }

  async function handleTogglePaymentStatus(transaction) {
    const newStatus = transaction.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    const confirmMsg = newStatus === 'PAID'
      ? `Selesaikan transaksi ${transaction.invoiceNo} (tandai LUNAS)?`
      : `Kembalikan transaksi ${transaction.invoiceNo} menjadi BELUM LUNAS?`;

    if (!confirm(confirmMsg)) return;

    setUpdatingId(transaction.id);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) {
        alert('Gagal memperbarui status transaksi');
        return;
      }
      setSelectedIds(prev => prev.filter(x => x !== transaction.id));
      await loadData();
      if (detailModal.open && detailModal.transaction?.id === transaction.id) {
        setDetailModal(prev => ({
          ...prev,
          transaction: { ...prev.transaction, paymentStatus: newStatus },
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

      {selectedIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: 16,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: '#34d399' }}>
            {selectedIds.length} transaksi belum lunas dipilih
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedIds([])}
              disabled={batchUpdating}
            >
              Batal
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={handleBatchMarkPaid}
              disabled={batchUpdating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle size={14} />
              {batchUpdating ? 'Memproses...' : 'Selesaikan Transaksi Terpilih'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllUnpaidSelected}
                      onChange={handleSelectAll}
                      title="Pilih semua transaksi belum lunas"
                      disabled={unpaidList.length === 0}
                      style={{ cursor: unpaidList.length === 0 ? 'default' : 'pointer', width: 16, height: 16, accentColor: '#10b981' }}
                    />
                  </th>
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
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <p className="empty-state-text">Belum ada transaksi</p>
                    </div>
                  </td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ textAlign: 'center' }}>
                      {t.paymentStatus === 'PAID' ? (
                        <span title="Transaksi sudah lunas" style={{ color: '#10b981', fontSize: 15 }}>✓</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t.id)}
                          onChange={() => handleToggleSelect(t.id)}
                          title="Centang untuk memilih / menyelesaikan transaksi ini"
                          style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#10b981' }}
                        />
                      )}
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-400)' }}>{t.invoiceNo}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.date)}</td>
                    <td>{tab === 'SALE' ? (t.customer?.name || 'Walk-in') : (t.supplier?.name || '-')}</td>
                    <td>{formatCurrency(t.subtotal)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.total)}</td>
                    <td>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: t.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          border: `1px solid ${t.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          userSelect: 'none',
                          transition: 'var(--transition)',
                        }}
                        title={t.paymentStatus === 'PAID' ? 'Klik centang untuk ubah status' : 'Centang untuk menyelesaikan transaksi (LUNAS)'}
                      >
                        <input
                          type="checkbox"
                          checked={t.paymentStatus === 'PAID'}
                          disabled={updatingId === t.id}
                          onChange={() => handleTogglePaymentStatus(t)}
                          style={{
                            cursor: 'pointer',
                            width: 15,
                            height: 15,
                            accentColor: '#10b981',
                            margin: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: t.paymentStatus === 'PAID' ? '#34d399' : '#fbbf24',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => viewDetail(t.id)} title="Detail"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => generateInvoicePDF({ ...t, items: t.items || [] }, business)} title="Cetak"><Printer size={14} /></button>
                        {t.paymentStatus !== 'PAID' && (
                          <button
                            className="btn btn-sm btn-success"
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleTogglePaymentStatus(t)}
                            disabled={updatingId === t.id}
                            title="Centang untuk menyelesaikan transaksi"
                          >
                            <Check size={13} /> Selesaikan
                          </button>
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
              {detailModal.transaction.paymentStatus !== 'PAID' ? (
                <button
                  className="btn btn-success"
                  onClick={() => handleTogglePaymentStatus(detailModal.transaction)}
                  disabled={updatingId === detailModal.transaction.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle size={14} /> {updatingId === detailModal.transaction.id ? 'Memproses...' : 'Selesaikan Transaksi (Lunas)'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTogglePaymentStatus(detailModal.transaction)}
                  disabled={updatingId === detailModal.transaction.id}
                  style={{ fontSize: 12 }}
                >
                  Ubah ke Belum Lunas
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
